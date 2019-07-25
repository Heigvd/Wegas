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
import com.wegas.core.Helper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.persistence.annotations.WegasEntity;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.AcceptInjection;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.*;
import com.wegas.core.persistence.variable.scope.*;
import com.wegas.core.persistence.variable.statemachine.DialogueDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.core.persistence.annotations.WegasConditions.And;
import com.wegas.core.persistence.annotations.WegasConditions.Equals;
import com.wegas.core.persistence.annotations.WegasConditions.Or;
import com.wegas.core.persistence.annotations.WegasRefs.Const;
import com.wegas.core.persistence.annotations.WegasRefs.Field;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.ValueGenerators.TeamScopeVal;
import com.wegas.editor.ValueGenerators.Zero;
import static com.wegas.editor.View.CommonView.FEATURE_LEVEL.ADVANCED;
import static com.wegas.editor.View.CommonView.LAYOUT.shortInline;
import com.wegas.editor.View.I18nStringView;
import com.wegas.editor.View.NumberView;
import com.wegas.editor.View.SelectView;
import com.wegas.editor.View.Textarea;
import com.wegas.editor.View.View;
import com.wegas.editor.View.VisibilitySelectView;
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
    @Index(columnList = "scope_id"),
    @Index(columnList = "label_id")
})
@NamedQuery(
        name = "VariableDescriptor.findAllNamesInModelAndItsScenarios",
        query = "SELECT DISTINCT(vd.name)"
        + "FROM GameModel model "
        + "LEFT JOIN GameModel scen ON (model = scen.basedOn AND scen.type = com.wegas.core.persistence.game.GameModel.GmType.SCENARIO)"
        + "JOIN VariableDescriptor vd ON (vd.gameModel = model OR vd.gameModel = scen)"
        + "WHERE model.id = :gameModelId AND (:refId IS NULL OR vd.refId <> :refId)"
)
/*@NamedQuery(
            name = "VariableDescriptor.findAllNamesInScenarioAndItsModelCluster",
            query = "SELECT DISTINCT(vd.name)"
            + " FROM GameModel scen "
            + " LEFT JOIN GameModel model ON (scen.basedOn = model)"
            + " LEFT JOIN GameModel other ON (scen.basedOn IS NOT NULL "
            + "                               AND other.basedOn = model "
            + "                               AND scen.type = com.wegas.core.persistence.game.GameModel.GmType.SCENARIO)"
            + " JOIN VariableDescriptor vd ON (vd.gameModel = other OR vd.gameModel = model)"
            + " WHERE scen.id = :gameModelId"
    )*/
@NamedQuery(
        name = "VariableDescriptor.findAllNamesInScenarioAndItsModel",
        query = "SELECT DISTINCT(vd.name)"
        + " FROM GameModel scen "
        + " LEFT JOIN GameModel model ON (model = scen.basedOn AND model.type = com.wegas.core.persistence.game.GameModel.GmType.MODEL)"
        + " JOIN VariableDescriptor vd ON (vd.gameModel = model OR vd.gameModel = scen)"
        + " WHERE scen.id = :gameModelId AND (:refId IS NULL OR vd.refId <> :refId)"
)
@NamedQuery(
        name = "VariableDescriptor.findByRootGameModelId",
        query = "SELECT DISTINCT vd FROM VariableDescriptor vd LEFT JOIN vd.gameModel AS gm WHERE gm.id = :gameModelId"
)
@NamedQuery(
        name = "VariableDescriptor.findByGameModelIdAndName",
        query = "SELECT vd FROM VariableDescriptor vd where vd.gameModel.id = :gameModelId AND vd.name LIKE :name",
        hints = {
            @QueryHint(name = QueryHints.QUERY_TYPE, value = QueryType.ReadObject),
            @QueryHint(name = QueryHints.CACHE_USAGE, value = CacheUsage.CheckCacheThenDatabase)}
)
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
    @JsonSubTypes.Type(name = "TriggerDescriptor", value = TriggerDescriptor.class),
    @JsonSubTypes.Type(name = "DialogueDescriptor", value = DialogueDescriptor.class),
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
@WegasEntity(callback = VariableDescriptor.VdMergeCallback.class)
public abstract class VariableDescriptor<T extends VariableInstance>
        extends AbstractEntity
        implements LabelledEntity, Broadcastable, AcceptInjection, ModelScoped {

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
    @WegasEntityProperty(searchable = true,
            optional = false, nullable = false, proposal = EmptyString.class,
            view = @View(
                    label = "Comments",
                    borderTop = true,
                    value = Textarea.class,
                    index = 9000))
    private String comments;

    /**
     *
     * The default instance for this variable.
     * <p>
     * According to WegasPatch spec, OVERRIDE should not be propagated to the instance when the descriptor is protected
     * <p>
     * Here we cannot use type T, otherwise jpa won't handle the db ref
     * correctly
     */
    @OneToOne(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, optional = false)
    @JsonView(value = Views.EditorI.class)
    @WegasEntityProperty(
            protectionLevel = ProtectionLevel.INTERNAL,
            nullable = false,
            optional = false,
            view = @View(
                    label = "Default instance",
                    index = 500
            ))
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

    @Column(length = 24, columnDefinition = "character varying(24) default 'PRIVATE'::character varying")
    @Enumerated(value = EnumType.STRING)
    @WegasEntityProperty(protectionLevel = ProtectionLevel.ALL,
            nullable = false,
            view = @View(label = "Visibility", value = VisibilitySelectView.class,
                    index = -300))
    private Visibility visibility = Visibility.PRIVATE;

    /**
     * a token to prefix the label with. For editors only
     */
    //@JsonView(Views.EditorI.class)
    @WegasEntityProperty(searchable = true,
            proposal = EmptyString.class,
            optional = false, nullable = false,
            view = @View(
                    label = "Tag",
                    description = "Never displayed to players",
                    index = -480
            ))
    private String editorTag = "";

    /**
     * Variable descriptor human readable name
     * Player visible
     */
    @OneToOne(cascade = CascadeType.ALL /*, orphanRemoval = true*/)
    @WegasEntityProperty(searchable = true,
            nullable = false, optional = false, proposal = EmptyI18n.class,
            view = @View(
                    label = "Label",
                    description = "Displayed to players",
                    value = I18nStringView.class,
                    index = -470
            ))
    private TranslatableContent label;

    @Transient
    @JsonIgnore
    protected String title;

    /**
     * variable name: used as identifier
     */
    @NotNull
    @Basic(optional = false)
    //@CacheIndex
    @WegasEntityProperty(protectionLevel = ProtectionLevel.INHERITED, searchable = true,
            nullable = false,
            view = @View(
                    featureLevel = ADVANCED,
                    label = "Script alias",
                    description = "Changing this may break your scripts! Use alphanumeric characters,'_','$'. No digit as first character.",
                    index = -460
            ))
    protected String name;

    //@BatchFetch(BatchFetchType.JOIN)
    //@JsonManagedReference
    @OneToOne(cascade = {CascadeType.ALL}/*, orphanRemoval = true*/, optional = false)
    @JoinFetch
    //@JsonView(value = Views.WithScopeI.class)
    //@WegasEntityProperty(callback = VdMergeCallback.class)
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    private AbstractScope scope;

    @Transient
    @WegasEntityProperty(
            proposal = TeamScopeVal.class,
            nullable = false,
            view = @View(
                    label = "One variable for",
                    value = SelectView.ScopeSelector.class,
                    layout = shortInline,
                    index = -400
            ))
    @Errored(CheckScope.class)
    private String scopeType;

    @Transient
    @WegasEntityProperty(
            proposal = TeamScopeVal.class,
            nullable = false,
            view = @View(
                    label = "Variable is visible by ",
                    value = SelectView.BScopeSelector.class,
                    layout = shortInline,
                    index = -390
            ))
    @Errored(CheckScope.class)
    private String broadcastScope;

    @Version
    @Column(columnDefinition = "bigint default '0'::bigint")
    @WegasEntityProperty(sameEntityOnly = true,
            nullable = false, optional = false,
            proposal = Zero.class,
            view = @View(
                    label = "Version",
                    readOnly = true,
                    value = NumberView.class,
                    featureLevel = ADVANCED,
                    index = -490,
                    layout = shortInline
            )
    )
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
        super();
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

    /**
     * Get the gameModel this descriptor stands in.
     * RootLevel descriptor only.
     *
     * @return
     */
    @JsonIgnore
    public GameModel getRoot() {
        return root;
    }

    /**
     * Set the root gameModel. Means this descriptor stands at gameModel root level
     *
     * @param rootGameModel
     */
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

    /**
     * @return
     */
    @JsonIgnore
    public DescriptorListI<? extends VariableDescriptor> getParentOrNull() {
        if (parentList != null) {
            return parentList;
        } else if (parentWh != null) {
            return parentWh;
        } else if (root != null) {
            return root;
        }
        return null;
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
            throw new WegasNotFoundException("ORPHAN DESCRIPTOR: " + this); // is somebody expect this exception or return null will do the job ?
        }
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
        String theLabel = this.getLabel().translateOrEmpty(this.getGameModel());

        if (!Helper.isNullOrEmpty(this.getEditorTag()) && !Helper.isNullOrEmpty(theLabel)) {
            return this.getEditorTag() + " - " + theLabel;
        } else if (!Helper.isNullOrEmpty(this.getEditorTag())) {
            return getEditorTag();
        } else if (!Helper.isNullOrEmpty(theLabel)) {
            return theLabel;
        } else {
            return this.getName();
        }
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

    @JsonIgnore
    public String getDeprecatedTitle() {
        return title;
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

    @JsonIgnore
    public String getDeserialisedScopeType() {
        return this.scopeType;
    }

    public String getScopeType() {
        if (this.scope != null) {
            return this.scope.getJSONClassName();
        } else {
            return scopeType;
        }
    }

    public void setScopeType(String scopeType) {
        this.scopeType = scopeType;
    }


    @JsonIgnore
    public String getDeserialisedBroadcastScopeType() {
        return this.broadcastScope;
    }

    public String getBroadcastScope() {
        if (this.scope != null) {
            return this.scope.getBroadcastScope();
        } else {
            return broadcastScope;
        }
    }

    public void setBroadcastScope(String broadcastScope) {
        this.broadcastScope = broadcastScope;
    }

    @Override
    public Visibility getVisibility() {
        return visibility;
    }

    @Override
    public void setVisibility(Visibility visibility) {
        this.visibility = visibility;
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
     * @return Class simple name + id
     */
    @Override
    public String toString() {
        return this.getClass().getSimpleName() + "( " + getId() + ", " + this.getName() + ", #" + Integer.toHexString(this.hashCode()) + " )";
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

    /**
     * WegasCallback for VariableDescriptor merge.
     * Two purpose:
     * <ul>
     * <li>create/destroy instances when scope changes</li>
     * <li>assert name is valid within the model cluster</li>
     * </ul>
     */
    public static class VdMergeCallback implements WegasCallback {

        @Override
        public void destroy(Mergeable entity, Object identifier) {
            if (entity instanceof VariableDescriptor) {
                VariableDescriptor vd = (VariableDescriptor) entity;
                vd.getVariableDescriptorFacade().preDestroy(vd.getGameModel(), vd);
            }
        }
    }

    @Override
    public Visibility getInheritedVisibility() {
        DescriptorListI<? extends VariableDescriptor> parent = getParent();
        if (parent instanceof VariableDescriptor) {
            return ((VariableDescriptor<VariableInstance>) parent).getVisibility();
        } else {
            return Visibility.INHERITED;
        }
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return this.getGameModel() != null && this.getGameModel().belongsToProtectedGameModel();
    }

    @Override
    public WithPermission getMergeableParent() {
        DescriptorListI<? extends VariableDescriptor> parent = this.getParentOrNull();
        if (parent instanceof VariableDescriptor) {
            return (VariableDescriptor) parent;
        } else if (parent instanceof GameModel) {
            return (GameModel) parent;
        } else {
            return null;
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

    public static class CheckScope extends Or {

        private static Field scope = new Field(null, "scopeType");
        private static Field bScope = new Field(null, "broadcastScope");
        private static Const ps = new Const("PlayerScope");
        private static Const ts = new Const("TeamScope");
        private static Const gs = new Const("GameModelScope");

        public CheckScope() {
            super(
                    new And(
                            new Equals(scope, ts),
                            new Equals(bScope, ps)
                    ),
                    new And(
                            new Equals(scope, gs),
                            new Or(
                                    new Equals(bScope, ps),
                                    new Equals(bScope, ts)
                            )
                    )
            );
        }
    }
}
