/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.Helper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationDeserializer;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.AcceptInjection;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.*;
import com.wegas.core.persistence.variable.scope.*;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.SingleResultChoiceDescriptor;
import com.wegas.mcq.persistence.wh.WhQuestionDescriptor;
import com.wegas.messaging.persistence.InboxDescriptor;
import com.wegas.resourceManagement.persistence.BurndownDescriptor;
import com.wegas.resourceManagement.persistence.ResourceDescriptor;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import org.eclipse.persistence.annotations.CacheIndex;
import org.eclipse.persistence.annotations.CacheIndexes;
import org.eclipse.persistence.annotations.JoinFetch;
import org.eclipse.persistence.config.CacheUsage;
import org.eclipse.persistence.config.QueryHints;
import org.eclipse.persistence.config.QueryType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @param <T>
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
//@EntityListeners({GmVariableDescriptorListener.class})
@Table(uniqueConstraints = {
    @UniqueConstraint(columnNames = {"gamemodel_id", "name"}) // Name has to be unique for the whole game model
// @UniqueConstraint(columnNames = {"parentlist_id", "name"}) // Name has to be unique within a list
// @UniqueConstraint(columnNames = {"root_id", "name"})       // Names have to be unique at the base of a game model (root elements)
}, indexes = {
    @Index(columnList = "defaultinstance_id"),
    @Index(columnList = "parentlist_id"),
    @Index(columnList = "parentwh_id"),
    @Index(columnList = "root_id"),
    @Index(columnList = "gamemodel_id"),
    @Index(columnList = "dtype"),
    @Index(columnList = "scope_id")
})
@NamedQueries({
    @NamedQuery(
            name = "VariableDescriptor.findByRootGameModelId",
            query = "SELECT DISTINCT vd FROM VariableDescriptor vd LEFT JOIN vd.gameModel AS gm WHERE gm.id = :gameModelId"
    ),
    @NamedQuery(
            name = "VariableDescriptor.findByGameModelIdAndName",
            query = "SELECT vd FROM VariableDescriptor vd where vd.gameModel.id = :gameModelId AND vd.name LIKE :name",
            hints = {
                @QueryHint(name = QueryHints.QUERY_TYPE, value = QueryType.ReadObject),
                @QueryHint(name = QueryHints.CACHE_USAGE, value = CacheUsage.CheckCacheThenDatabase)}
    )
})
@CacheIndexes(value = {
    @CacheIndex(columnNames = {"GAMEMODEL_ID", "NAME"}) // bug uppercase: https://bugs.eclipse.org/bugs/show_bug.cgi?id=407834
})
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "ListDescriptor", value = ListDescriptor.class),
    @JsonSubTypes.Type(name = "StringDescriptor", value = StringDescriptor.class),
    @JsonSubTypes.Type(name = "TextDescriptor", value = TextDescriptor.class),
    @JsonSubTypes.Type(name = "BooleanDescriptor", value = BooleanDescriptor.class),
    @JsonSubTypes.Type(name = "NumberDescriptor", value = NumberDescriptor.class),
    @JsonSubTypes.Type(name = "InboxDescriptor", value = InboxDescriptor.class),
    @JsonSubTypes.Type(name = "FSMDescriptor", value = StateMachineDescriptor.class),
    @JsonSubTypes.Type(name = "ResourceDescriptor", value = ResourceDescriptor.class),
    @JsonSubTypes.Type(name = "TaskDescriptor", value = TaskDescriptor.class),
    @JsonSubTypes.Type(name = "QuestionDescriptor", value = QuestionDescriptor.class),
    @JsonSubTypes.Type(name = "WhQuestionDescriptor", value = WhQuestionDescriptor.class),
    @JsonSubTypes.Type(name = "ChoiceDescriptor", value = ChoiceDescriptor.class),
    @JsonSubTypes.Type(name = "SingleResultChoiceDescriptor", value = SingleResultChoiceDescriptor.class),
    @JsonSubTypes.Type(name = "ObjectDescriptor", value = ObjectDescriptor.class),
    @JsonSubTypes.Type(name = "PeerReviewDescriptor", value = PeerReviewDescriptor.class),
    @JsonSubTypes.Type(name = "BurndownDescriptor", value = BurndownDescriptor.class)
})
//@MappedSuperclass
abstract public class VariableDescriptor<T extends VariableInstance> extends AbstractEntity implements Searchable, LabelledEntity, Broadcastable, AcceptInjection {

    private static final long serialVersionUID = 1L;

    protected static final Logger logger = LoggerFactory.getLogger(VariableDescriptor.class);

    /**
     * HACK
     * <p>
     * Injecting VariableDescriptorFacade here don't bring business logic within
     * data because the very only functionality that is being used here aims to
     * replace some slow JPA mechanisms
     * <p>
     */
    @JsonIgnore
    @Transient
    private VariableDescriptorFacade variableDescriptorFacade;

    @JsonIgnore
    @Transient
    protected Beanjection beans;

    /**
     *
     */
    @Lob
    @JsonView(value = Views.EditorI.class)
    @Column(name = "comments")
    private String comments;

    /**
     * Here we cannot use type T, otherwise jpa won't handle the db ref
     * correctly
     */
    @OneToOne(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, optional = false)
    @JsonView(value = Views.EditorI.class)
    private VariableInstance defaultInstance;

    /**
     *
     */
    //@JsonBackReference
    @ManyToOne
    @CacheIndex
    private GameModel gameModel;

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @ManyToOne
    @JsonIgnore
    private ListDescriptor parentList;

    @ManyToOne
    @JsonIgnore
    private WhQuestionDescriptor parentWh;

    @ManyToOne
    @JsonIgnore
    private GameModel root;

    /**
     * variable name: used as identifier
     */
    @NotNull
    @Basic(optional = false)
    protected String name;

    /**
     * a token to prefix the label with. For editors only
     */
    private String editorTag;

    @Transient
    @JsonIgnore
    protected String title;

    /**
     * Variable descriptor human readable name
     * Player visible
     */
    @OneToOne(cascade = CascadeType.ALL)
    @JsonDeserialize(using = TranslationDeserializer.class)
    private TranslatableContent label;

    @OneToOne(cascade = {CascadeType.ALL}, orphanRemoval = true, optional = false)
    @JoinFetch
    private AbstractScope scope;

    @Version
    @Column(columnDefinition = "bigint default '0'::bigint")
    private Long version;

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

    /**
     *
     */
    public VariableDescriptor() {
    }

    /**
     * @param name
     */
    public VariableDescriptor(String name) {
        this.name = name;
    }

    /**
     * @param defaultInstance
     */
    public VariableDescriptor(T defaultInstance) {
        this.defaultInstance = defaultInstance;
    }

    /**
     * @return descriptor comments
     */
    public String getComments() {
        return comments;
    }

    /**
     * @param comments
     */
    public void setComments(String comments) {
        this.comments = comments;
    }

    /**
     * @return the defaultInstance
     */
    public T getDefaultInstance() {
        return (T) defaultInstance;
    }

    /**
     * @param defaultInstance the defaultValue to set
     */
    public void setDefaultInstance(T defaultInstance) {
        this.defaultInstance = defaultInstance;
        if (this.defaultInstance != null) {
            this.defaultInstance.setDefaultDescriptor(this);
        }
    }

    /**
     * @return the gameMobel this belongs to
     */
    @JsonIgnore
    public GameModel getGameModel() {
        return this.gameModel;
    }

    /**
     * @param gameModel
     */
    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    @JsonIgnore
    public GameModel getRoot() {
        return root;
    }

    public void setRoot(GameModel rootGameModel) {
        this.root = rootGameModel;
        logger.trace("set {} root to {}", this, this.root);
        if (this.root != null) {
            this.setParentList(null);
            this.setParentWh(null);
        }
    }

    public ListDescriptor getParentList() {
        return parentList;
    }

    public void setParentList(ListDescriptor parentList) {
        this.parentList = parentList;
        logger.trace("set {} parentList to {}", this, this.parentList);
        if (this.parentList != null) {
            this.setRoot(null);
            this.setParentWh(null);
        }
    }

    public WhQuestionDescriptor getParentWh() {
        return parentWh;
    }

    public void setParentWh(WhQuestionDescriptor parentWh) {
        this.parentWh = parentWh;
        logger.trace("set {} parentWh to {}", this, this.parentWh);
        if (this.parentWh != null) {
            this.setRoot(null);
            this.setParentList(null);
        }
    }

    @JsonIgnore
    public DescriptorListI<? extends VariableDescriptor> getParent() {
        if (parentList != null) {
            return parentList;
        } else if (parentWh != null) {
            return parentWh;
        } else if (root != null) {
            return root;
        } else {
            throw new WegasNotFoundException("ORPHAN DESCRIPTOR");
        }
    }

    @JsonView(Views.IndexI.class)
    public String getParentDescriptorType() {
        if (this.getRoot() != null) {
            return "GameModel";
        } else {
            return "VariableDescriptor";
        }
    }

    public void setParentDescriptorType(String type) {
        // nothing to do
    }

    @JsonView(Views.IndexI.class)
    public Long getParentDescriptorId() {
        try {
            return this.getParent().getId();
        } catch (WegasNotFoundException e) {
            return null;
        }
    }

    public void setParentDescriptorId(Long id) {
        // nothing to do
    }

    /**
     * @return id of gameModel this belongs to
     */
    @JsonIgnore
    public Long getGameModelId() {
        return this.gameModel.getId();
    }

    /**
     * @return descriptor id
     */
    @Override
    public Long getId() {
        return id;
    }

    @Deprecated
    public T findInstance(VariableInstance variableInstance) {
        return this.findInstance(variableInstance, null);
    }

    /**
     * Retrieve an instance the owner has also write permission on given variableInstance
     *
     * @param variableInstance an instance of another descriptor
     * @param user             player owner to prioritise
     *
     * @return instance of this
     *
     */
    @JsonIgnore
    public T findInstance(VariableInstance variableInstance, User user) {

        // if the given VariableInstance is a default instance, return the descripto default instance
        if (variableInstance.isDefaultInstance()) {
            return this.getDefaultInstance();
        }

        InstanceOwner owner = variableInstance.getOwner();
        List<Player> players = owner.getLivePlayers();

        if (players == null || players.isEmpty()) {
            return null;
        } else {
            if (user != null) {
                for (Player p : players) {
                    if (user.equals(p.getUser())) {
                        return (T) scope.getVariableInstance(p);
                    }
                }
            }
        }
        return (T) scope.getVariableInstance(players.get(0));
    }

    /**
     * Fetch variable instance for the given player
     *
     * @param player
     *
     * @return variableInstance belonging to the player
     */
    public T getInstance(Player player) {
        return (T) this.getScope().getVariableInstance(player);
    }

    /**
     * @return get instance belonging to the current player
     */
    @JsonIgnore
    @Deprecated
    public T getInstance() {
        logger.error("VariableDescriptor#getInstance() is deprecated!");
        return (T) this.getScope().getInstance();
    }

    /**
     * @param defaultInstance indicate whether one wants the default instance r
     *                        the one belonging to player
     * @param player          the player
     *
     * @return either the default instance of the one belonging to player
     */
    @JsonIgnore
    public T getInstance(Boolean defaultInstance, Player player) {
        if (defaultInstance) {
            return this.getDefaultInstance();
        } else {
            return this.getInstance(player);
        }
    }

    @JsonIgnore
    public String getEditorLabel() {
        if (this.getEditorTag() == null && this.getLabel() == null) {
            return this.getName();
        }
        if (this.getEditorTag() == null) {
            return this.getLabel().translateOrEmpty(this.getGameModel());
        }
        return this.getEditorTag() + " - " + this.getLabel();
    }

    /**
     * get the editor label prefix.
     *
     * @return
     */
    public String getEditorTag() {
        return this.editorTag;
    }

    public void setEditorTag(String editorTag) {
        this.editorTag = editorTag;
    }

    /**
     * @return the label
     */
    @Override
    public TranslatableContent getLabel() {
        return label;
    }

    /**
     * @param label the label to set
     */
    @Override
    public void setLabel(TranslatableContent label) {
        this.label = label;
        if (this.label != null) {
            this.label.setParentDescriptor(this);
        }
    }

    /**
     * Backward compat
     *
     * @return
     */
    @JsonIgnore
    @Deprecated
    public String getTitle() {
        return this.getLabel().translateOrEmpty(this.getGameModel());
    }

    /**
     * Backwardcompat
     *
     * @param title
     */
    @Deprecated
    @JsonProperty
    public void setTitle(String title) {
        this.title = title;
    }

    /**
     * Get the descriptor internal name (aka scriptAlias)
     *
     * @return the descriptor name
     */
    @Override
    public String getName() {
        return name;
    }

    /**
     * @param name
     */
    @Override
    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return the scope
     */
    public AbstractScope getScope() {
        return scope;
    }

    /**
     * @param scope the scope to set
     *
     * @fixme here we cannot use managed references since this.class is
     * abstract.
     */
    //@JsonManagedReference
    public void setScope(AbstractScope scope) {
        this.scope = scope;
        if (scope != null) {
            scope.setVariableDescscriptor(this);
        }
    }

    /**
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof VariableDescriptor) {
            try {
                VariableDescriptor other = (VariableDescriptor) a;
                this.setVersion(other.getVersion());
                this.setName(other.getName());
                this.setEditorTag(other.getEditorTag());
                this.setLabel(TranslatableContent.merger(this.getLabel(), other.getLabel()));
                this.setComments(other.getComments());
                this.getDefaultInstance().merge(other.getDefaultInstance());
                if (other.getScope() != null) {
                    if (this.getScope() != null && this.getScope().getClass() != other.getScope().getClass()) {
                        this.getVariableDescriptorFacade().updateScope(this, other.getScope());
                    } else {
                        this.getScope().setBroadcastScope(other.getScope().getBroadcastScope());
                    }
                }
            } catch (PersistenceException pe) {
                throw WegasErrorMessage.error("The name is already in use");
            }
            //this.scope.merge(vd.getScope());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    /**
     *
     */
    //@PrePersist
    public void prePersist() {
        /*if (this.getScope() == null) {
            this.setScope(new TeamScope());
        }*/
    }

    /**
     * @param context allow to circumscribe the propagation within the given
     *                context. It may be an instance of GameModel, Game, Team,
     *                or Player
     */
    public void propagateDefaultInstance(InstanceOwner context, boolean create) {
        int sFlag = 0;
        if (scope instanceof GameModelScope) { // gms
            sFlag = 4;
        } else if (scope instanceof TeamScope) { // ts
            sFlag = 2;
        } else if (scope instanceof PlayerScope) { // ps
            sFlag = 1;
        }

        if ((context == null) // no-context
                || (context instanceof GameModel) // gm ctx -> do not skip anything
                || (context instanceof Game && sFlag < 4) // g ctx -> skip gms
                || (context instanceof Team && sFlag < 3) // t ctx -> skip gms, gs
                || (context instanceof Player && sFlag < 2)) { // p ctx -> skip gms, gs, ts
            scope.propagateDefaultInstance(context, create);
        }
    }

    public void createInstances(InstanceOwner instanceOwner) {
        if ((scope instanceof GameModelScope && instanceOwner instanceof GameModel)
                || (scope instanceof TeamScope && instanceOwner instanceof Team)
                || (scope instanceof PlayerScope && instanceOwner instanceof Player)) {
            scope.propagateDefaultInstance(instanceOwner, true);
        }
    }

    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        Map<String, List<AbstractEntity>> map = new HashMap<>();
        ArrayList<AbstractEntity> entities = new ArrayList<>();
        entities.add(this);
        map.put(this.getGameModel().getChannel(), entities);
        return map;
    }

    /**
     * true if this descriptor or (if applicable) its default instance matches
     * all the given criterias
     *
     * @param criterias
     *
     * @return return true if there is a match
     */
    @Override
    public Boolean containsAll(final List<String> criterias) {
        Boolean found = Helper.insensitiveContainsAll(this.getName(), criterias)
                || Helper.insensitiveContainsAll(this.getEditorTag(), criterias)
                || this.getLabel().containsAll(criterias)
                || Helper.insensitiveContainsAll(this.getComments(), criterias);
        if (!found && (this.getDefaultInstance() instanceof Searchable)) {
            return ((Searchable) this.getDefaultInstance()).containsAll(criterias);
        }
        return found;
    }

    /**
     * @return Class simple name + id
     */
    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", " + this.getName() + ")";
    }

    @Override
    public void setBeanjection(Beanjection beanjection) {
        this.beans = beanjection;
    }

    private VariableDescriptorFacade getVariableDescriptorFacade() { // SEE UPDATE SCOPE IN MERGE
        if (this.beans != null && this.beans.getVariableDescriptorFacade() != null) {
            return this.beans.getVariableDescriptorFacade();
        } else if (this.variableDescriptorFacade == null) {
            logger.error("LOOKUP OCCURS : " + this);
            Helper.printWegasStackTrace(new Exception());
            this.variableDescriptorFacade = VariableDescriptorFacade.lookup();
        }

        return this.variableDescriptorFacade;
    }

    public void revive(Beanjection beans) {
        if (this.title != null) {
            if (title.isEmpty()) {
                // title is defined but empty -> not prefix, don't change label
                // eg:  label="[r5b] Meet someone'; title=""; prefix = ""; label="[r5b] Meet someone"
                this.setEditorTag("");
            } else {
                String importedLabel = getLabel().translateOrEmpty(this.getGameModel());
                if (importedLabel == null) {
                    importedLabel = "";
                }
                // eg:  label="[r5b] Meet someone'; title="Meet someone"; prefix = "[r5b]"; label="Meet someone"
                // eg:  label="Meet someone'; title="Meet someone"; prefix = ""; label="Meet someone"
                // eg:  label=""; title="Meet someone"; prefix = ""; label="Meet someone"
                this.setEditorTag(importedLabel.replace(title, "").trim());
                this.setLabel(TranslatableContent.build("def", title));
            }
            this.title = null;
        }
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getGameModel().getRequieredReadPermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getGameModel().getRequieredUpdatePermission();
    }
}
