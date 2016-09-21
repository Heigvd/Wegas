/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.*;
import com.wegas.core.persistence.variable.scope.*;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.SingleResultChoiceDescriptor;
import com.wegas.messaging.persistence.InboxDescriptor;
import com.wegas.resourceManagement.persistence.BurndownDescriptor;
import com.wegas.resourceManagement.persistence.ResourceDescriptor;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import org.eclipse.persistence.annotations.JoinFetch;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @param <T>
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
//@EntityListeners({GmVariableDescriptorListener.class})
@Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"gamemodel_gamemodelid", "name"}) // Name has to be unique for the whole game model
// @UniqueConstraint(columnNames = {"variabledescriptor_id", "name"})           // Name has to be unique within a list
// @UniqueConstraint(columnNames = {"rootgamemodel_id", "name"})                // Names have to be unique at the base of a game model (root elements)
}, indexes = {
        @Index(columnList = "defaultinstance_variableinstance_id"),
        @Index(columnList = "items_variabledescriptor_id"),
        @Index(columnList = "rootgamemodel_id"),
        @Index(columnList = "dtype")
})
@NamedQueries({
        @NamedQuery(
                name = "VariableDescriptor.findByRootGameModelId",
                query = "SELECT DISTINCT vd FROM VariableDescriptor vd LEFT JOIN vd.gameModel AS gm WHERE gm.id = :gameModelId"
        ),
        @NamedQuery(
                name = "VariableDescriptor.findByGameModelIdAndName",
                query = "SELECT vd FROM VariableDescriptor vd where vd.gameModel.id = :gameModelId AND vd.name LIKE :name"
        )
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
        @JsonSubTypes.Type(name = "ChoiceDescriptor", value = ChoiceDescriptor.class),
        @JsonSubTypes.Type(name = "SingleResultChoiceDescriptor", value = SingleResultChoiceDescriptor.class),
        @JsonSubTypes.Type(name = "ObjectDescriptor", value = ObjectDescriptor.class),
        @JsonSubTypes.Type(name = "PeerReviewDescriptor", value = PeerReviewDescriptor.class),
        @JsonSubTypes.Type(name = "BurndownDescriptor", value = BurndownDescriptor.class)
})
abstract public class VariableDescriptor<T extends VariableInstance> extends NamedEntity implements Searchable, LabelledEntity, Broadcastable {

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    @Lob
    @JsonView(value = Views.EditorI.class)
    @Column(name = "Descriptor_comments")
    private String comments;

    /**
     * Here we cannot use type T, otherwise jpa won't handle the db ref
     * correctly
     */
    @OneToOne(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, optional = false)
    @JsonView(value = Views.EditorExtendedI.class)
    private VariableInstance defaultInstance;

    /**
     *
     */
    //@JsonBackReference
    @ManyToOne
    @JoinColumn
    //@CacheIndex
    private GameModel gameModel;

    /**
     *
     */
    @Id
    @Column(name = "variabledescriptor_id")
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "items_variabledescriptor_id")
    @JsonIgnore
    private ListDescriptor parentList;

    @ManyToOne
    @JoinColumn(name = "rootgamemodel_id")
    @JsonIgnore
    private GameModel rootGameModel;

    /**
     *
     */
    //@JsonView(Views.EditorI.class)
    private String label;

    /*
     * @OneToOne(cascade = CascadeType.ALL) @NotNull @JoinColumn(name
     * ="SCOPE_ID", unique = true, nullable = false, insertable = true,
     * updatable = true)
     */
    //@BatchFetch(BatchFetchType.JOIN)
    //@JsonManagedReference
    @OneToOne(cascade = {CascadeType.ALL}, orphanRemoval = true, optional = false)
    @JoinFetch
    @JsonView(value = Views.WithScopeI.class)
    private AbstractScope scope;

    /**
     * Title displayed in the for the player, should be removed from variable
     * descriptor and placed in the required entities (MCQQuestionDrescriptor,
     * TriggerDescriptor, aso)
     */
    @Column(name = "editorLabel")
    private String title;

    /**
     *
     */
    //@JsonView(Views.EditorExtendedI.class)
    @NotNull
    @Basic(optional = false)
    //@CacheIndex
    protected String name;

    /**
     *
     */
    //@ManyToMany(cascade = {CascadeType.MERGE, CascadeType.PERSIST, CascadeType.REFRESH})
    //@JoinTable(joinColumns = {
    //    @JoinColumn(referencedColumnName = "variabledescriptor_id")},
    //        inverseJoinColumns = {
    //    @JoinColumn(referencedColumnName = "tag_id")})
    //@XmlTransient
    //private List<Tag> tags;

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
     * @param name
     * @param defaultInstance
     */
    public VariableDescriptor(String name, T defaultInstance) {
        this.name = name;
        this.defaultInstance = defaultInstance;
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
    public GameModel getRootGameModel() {
        return rootGameModel;
    }

    public void setRootGameModel(GameModel rootGameModel) {
        this.rootGameModel = rootGameModel;
        if (this.rootGameModel != null) {
            this.setParentList(null);
        }
    }

    public ListDescriptor getParentList() {
        return parentList;
    }

    public void setParentList(ListDescriptor parentList) {
        this.parentList = parentList;
        if (this.parentList != null) {
            this.setRootGameModel(null);
        }
    }

    @JsonIgnore
    public DescriptorListI<? extends VariableDescriptor> getParent() {
        if (parentList != null) {
            return parentList;
        } else if (rootGameModel != null) {
            return rootGameModel;
        } else {
            throw new WegasNotFoundException("ORPHAN DESCRIPTOR");
        }
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

    /**
     * Fetch variable instance for the given player
     *
     * @param player
     * @return variableInstance belonging to the player
     */
    public T getInstance(Player player) {
        return (T) this.getScope().getVariableInstance(player);
    }

    /**
     * @return get instance belonging to the current player
     */
    @JsonIgnore
    public T getInstance() {
        return (T) this.getScope().getInstance();
    }

    /**
     * @param defaultInstance indicate whether one wants the default instance r
     *                        the one belonging to player
     * @param player          the player
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

    /**
     * @return the label
     */
    @Override
    public String getLabel() {
        return label;
    }

    /**
     * @param label the label to set
     */
    @Override
    public void setLabel(String label) {
        this.label = label;
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
     * @return title
     */
    public String getTitle() {
        return title;
    }

    /**
     * @param title
     */
    public void setTitle(String title) {
        this.title = title;
    }

    /**
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof VariableDescriptor) {
            try {
                super.merge(a);
                VariableDescriptor other = (VariableDescriptor) a;
                this.setName(other.getName());
                this.setLabel(other.getLabel());
                this.setTitle(other.getTitle());
                this.setComments(other.getComments());
                this.getDefaultInstance().merge(other.getDefaultInstance());
                if (other.getScope() != null) {
                    this.getScope().setBroadcastScope(other.getScope().getBroadcastScope());
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
     *                context. It may be an instance of GameModel, Game, Team, or Player
     */
    public void propagateDefaultInstance(AbstractEntity context) {
        int sFlag = 0;
        if (scope instanceof GameModelScope) { // gms
            sFlag = 4;
        } else if (scope instanceof GameScope) { // gs
            sFlag = 3;
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
            scope.propagateDefaultInstance(context);
        }
    }

    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        Map<String, List<AbstractEntity>> map = new HashMap<>();
        ArrayList<AbstractEntity> entities = new ArrayList<>();
        entities.add(this);
        //logger.error("CHANNEL TOKEN: " + Helper.getAudienceToken(this.getGameModel()));
        map.put(Helper.getAudienceToken(this.getGameModel()), entities);
        return map;
    }

    /**
     * true if this descriptor or (if applicable) its default instance matches
     * all the given criterias
     *
     * @param criterias
     * @return return true if there is a match
     */
    @Override
    public Boolean containsAll(final List<String> criterias) {
        Boolean found = Helper.insensitiveContainsAll(this.getName(), criterias)
                || Helper.insensitiveContainsAll(this.getLabel(), criterias)
                || Helper.insensitiveContainsAll(this.getTitle(), criterias)
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
}
