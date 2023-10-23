/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import ch.albasim.wegas.annotations.CommonView;
import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.ADVANCED;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.annotations.WegasConditions.Equals;
import com.wegas.core.persistence.annotations.WegasConditions.Not;
import com.wegas.core.persistence.annotations.WegasRefs;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.persistence.variable.VariableDescriptor.Isolation;
import com.wegas.core.persistence.variable.primitive.AchievementInstance;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.ObjectInstance;
import com.wegas.core.persistence.variable.primitive.StaticTextInstance;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.persistence.variable.scope.AbstractScope.ScopeType;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.Zero;
import com.wegas.editor.view.NumberView;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.wh.WhQuestionInstance;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.resourceManagement.persistence.BurndownInstance;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.reviewing.persistence.PeerReviewInstance;
import com.wegas.survey.persistence.SurveyInstance;
import com.wegas.survey.persistence.input.SurveyInputInstance;
import com.wegas.survey.persistence.input.SurveySectionInstance;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToOne;
import jakarta.persistence.QueryHint;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.eclipse.persistence.annotations.CacheIndex;
import org.eclipse.persistence.annotations.CacheIndexes;
import org.eclipse.persistence.annotations.OptimisticLocking;
import org.eclipse.persistence.config.CacheUsage;
import org.eclipse.persistence.config.QueryHints;
import org.eclipse.persistence.config.QueryType;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@NamedQuery(name = "VariableInstance.findPlayerInstance",
    query = "SELECT vi FROM VariableInstance vi WHERE "
    + "(vi.player.id = :playerId AND vi.playerScope.id = :scopeId)",
    hints = {
        @QueryHint(name = QueryHints.QUERY_TYPE, value = QueryType.ReadObject),
        @QueryHint(name = QueryHints.CACHE_USAGE, value = CacheUsage.CheckCacheThenDatabase)
    }
)
@NamedQuery(name = "VariableInstance.findTeamInstance",
    query = "SELECT vi FROM VariableInstance vi WHERE "
    + "(vi.team.id = :teamId AND vi.teamScope.id = :scopeId)",
    hints = {
        @QueryHint(name = QueryHints.QUERY_TYPE, value = QueryType.ReadObject),
        @QueryHint(name = QueryHints.CACHE_USAGE, value = CacheUsage.CheckCacheThenDatabase)
    }
)
@NamedQuery(name = "VariableInstance.findAllPlayerInstances",
    query = "SELECT vi FROM VariableInstance vi WHERE "
    + "(vi.playerScope.id = :scopeId)"
)
@NamedQuery(name = "VariableInstance.findAllTeamInstances",
    query = "SELECT vi FROM VariableInstance vi WHERE "
    + "(vi.teamScope.id = :scopeId)"
)
@NamedQuery(name = "VariableInstance.findReadablePlayerInstances",
    query = "SELECT vi FROM VariableInstance vi WHERE "
    + "(vi.player.id = :playerId AND vi.playerScope.variableDescriptor.isolation <> com.wegas.core.persistence.variable.VariableDescriptor.Isolation.HIDDEN)"
)
@NamedQuery(name = "VariableInstance.findReadableTeamInstances",
    query = "SELECT vi FROM VariableInstance vi WHERE"
    + "(vi.team.id = :teamId AND vi.teamScope.variableDescriptor.isolation <> com.wegas.core.persistence.variable.VariableDescriptor.Isolation.HIDDEN)"
)
@NamedQuery(name = "VariableInstance.findReadableGameModelInstances",
    query = "SELECT vi FROM VariableInstance vi WHERE "
    + "(vi.gameModel.id = :gameModelId AND vi.gameModelScope.variableDescriptor.isolation <> com.wegas.core.persistence.variable.VariableDescriptor.Isolation.HIDDEN)"
)
@CacheIndexes(value = {
    @CacheIndex(columnNames = {"GAMEMODELSCOPE_ID", "GAMEMODEL_ID"}),
    @CacheIndex(columnNames = {"TEAMSCOPE_ID", "TEAM_ID"}),
    @CacheIndex(columnNames = {"PLAYERSCOPE_ID", "PLAYER_ID"})
})
@Table(indexes = {
    @Index(columnList = "gamemodelscope_id"),
    @Index(columnList = "gamemodel_id"),
    @Index(columnList = "teamscope_id"),
    @Index(columnList = "team_id"),
    @Index(columnList = "playerscope_id"),
    @Index(columnList = "player_id")
})
//@JsonIgnoreProperties(value={"descriptorId"})
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "AchievementInstance", value = AchievementInstance.class),
    @JsonSubTypes.Type(name = "StringInstance", value = StringInstance.class),
    @JsonSubTypes.Type(name = "TextInstance", value = TextInstance.class),
    @JsonSubTypes.Type(name = "StaticTextInstance", value = StaticTextInstance.class),
    @JsonSubTypes.Type(name = "BooleanInstance", value = BooleanInstance.class),
    @JsonSubTypes.Type(name = "ListInstance", value = ListInstance.class),
    @JsonSubTypes.Type(name = "NumberInstance", value = NumberInstance.class),
    @JsonSubTypes.Type(name = "InboxInstance", value = InboxInstance.class),
    @JsonSubTypes.Type(name = "FSMInstance", value = StateMachineInstance.class),
    @JsonSubTypes.Type(name = "QuestionInstance", value = QuestionInstance.class),
    @JsonSubTypes.Type(name = "WhQuestionInstance", value = WhQuestionInstance.class),
    @JsonSubTypes.Type(name = "ChoiceInstance", value = ChoiceInstance.class),
    @JsonSubTypes.Type(name = "ResourceInstance", value = ResourceInstance.class),
    @JsonSubTypes.Type(name = "TaskInstance", value = TaskInstance.class),
    @JsonSubTypes.Type(name = "ObjectInstance", value = ObjectInstance.class),
    @JsonSubTypes.Type(name = "PeerReviewInstance", value = PeerReviewInstance.class),
    @JsonSubTypes.Type(name = "SurveyInstance", value = SurveyInstance.class),
    @JsonSubTypes.Type(name = "SurveySectionInstance", value = SurveySectionInstance.class),
    @JsonSubTypes.Type(name = "SurveyInputInstance", value = SurveyInputInstance.class),
    @JsonSubTypes.Type(name = "BurndownInstance", value = BurndownInstance.class)
})
@OptimisticLocking(cascade = true)
//@Cacheable(false)
abstract public class VariableInstance extends AbstractEntity implements Broadcastable {

    private static final long serialVersionUID = 1L;

    @Version
    @Column(columnDefinition = "bigint default 0::bigint")
    @WegasEntityProperty(nullable = false, optional = false, proposal = Zero.class,
        sameEntityOnly = true, view = @View(
            index = -999,
            label = "Version",
            readOnly = true,
            value = NumberView.class,
            featureLevel = ADVANCED
        ))
    @JsonView(Views.IndexI.class)
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
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     *
     */
    @ManyToOne
    @JsonIgnore
    private TeamScope teamScope;

    /**
     *
     */
    @ManyToOne
    @JsonIgnore
    private PlayerScope playerScope;

    /**
     *
     */
    @OneToOne
    @JsonIgnore
    private GameModelScope gameModelScope;
    /**
     *
     */
    @OneToOne(fetch = FetchType.LAZY, mappedBy = "defaultInstance")
    @JsonIgnore
    private VariableDescriptor defaultDescriptor;

    /**
     *
     */
    @ManyToOne
    @JsonIgnore
    private Player player;

    @ManyToOne
    @JsonIgnore
    private GameModel gameModel;

    /**
     *
     */
    @ManyToOne
    @JsonIgnore
    private Team team;

    @Override
    public VariableInstance duplicate() throws CloneNotSupportedException {
        return (VariableInstance) super.duplicate();
    }

    /**
     * Return the effective owner of the instance, null for default instances
     *
     * @return effective instance owner, but null for default ones
     */
    @JsonIgnore
    public InstanceOwner getOwner() {
        if (isDefaultInstance()) {
            return null;
        } else {
            if (this.getTeam() != null) {
                return this.getTeam();
            } else if (this.getPlayer() != null) {
                return this.getPlayer();
            } else {
                return this.getGameModel();
                //return this.findDescriptor().getGameModel();
            }
        }
    }

    /**
     *
     * Same as getOwner but return the gameModel for default instances
     *
     * @return effective instance owner or the gameModel for default ones
     */
    @JsonIgnore
    public InstanceOwner getEffectiveOwner() {
        if (this.getTeam() != null) {
            return this.getTeam();
        } else if (this.getPlayer() != null) {
            return this.getPlayer();
        } else {
            //return this.getGameModel();
            return this.findDescriptor().getGameModel();
        }
    }

    /**
     * Get the channel to broadcast this instance on, according to scope and broadcast scope
     *
     * @return
     */
    @JsonIgnore
    public String getAudience() {
        InstanceOwner audienceOwner = getBroadcastTarget();
        if (audienceOwner != null) {
            VariableDescriptor descriptor = this.getDescriptor();
            if (descriptor != null) {
                if (descriptor.getIsolation() == Isolation.HIDDEN) {
                    return descriptor.getGameModel().getEditorChannel();
                }
            }
            return audienceOwner.getChannel();
        } else {
            return null;
        }
    }

    @JsonIgnore
    public InstanceOwner getBroadcastTarget() {
        if (this.getTeam() != null) {
            if (this.getTeamScope().getBroadcastScope() == ScopeType.GameModelScope) {
                return this.getTeam().getGame();
            } else {
                return this.getTeam();
            }
        } else if (this.getPlayer() != null) {
            if (this.getPlayerScope().getBroadcastScope() == ScopeType.TeamScope) {
                return this.getPlayer().getTeam();
            } else if (this.getPlayerScope().getBroadcastScope() == ScopeType.GameModelScope) {
                return this.getPlayer().getGame();
            } else {
                return this.getPlayer();
            }
        } else if (this.gameModelScope != null) {
            // this.getGameModel().getChannel();
            return this.getGameModelScope().getVariableDescriptor().getGameModel();
        } else {
            // Default instance
            return null;
        }
    }

    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        String audience = this.getAudience();
        if (audience != null) {
            Map<String, List<AbstractEntity>> map = new HashMap<>();
            ArrayList<AbstractEntity> entities = new ArrayList<>();
            entities.add(this);
            map.put(this.getAudience(), entities);
            return map;
        } else if (this.getDefaultDescriptor() != null) {
            // Default instance -> Propagate descriptor
            return this.getDefaultDescriptor().getEntities();
        } else {
            return null;
        }
    }

    /*
     * @PostUpdate @PostRemove @PostPersist public void onInstanceUpdate() { // If the instance has
     * no scope, it means it's a default if (this.getScope() != null) { //
     * RequestFacade.lookup().getRequestManager().addUpdatedInstance(this); } }
     */
    /**
     * @return the scope
     */
    @JsonIgnore
    //@JsonView(Views.ExtendedI.class)
    public AbstractScope getScope() {
        if (this.getTeamScope() != null) {
            return this.getTeamScope();
        } else if (this.getPlayerScope() != null) {
            return this.getPlayerScope();
        } else if (this.getGameModelScope() != null) {
            return this.getGameModelScope();
        } else {
            return null;
        }
    }

    @JsonView(Views.IndexI.class)
    @WegasExtraProperty(view = @View(
        index = -500,
        label = "Scope Key",
        featureLevel = CommonView.FEATURE_LEVEL.INTERNAL,
        value = NumberView.class
    ))
    public Long getScopeKey() {
        if (this.getTeamScope() != null) {
            return this.getTeam().getId();
        } else if (this.getPlayerScope() != null) {
            return this.getPlayer().getId();
        } else if (this.getGameModelScope() != null) {
            return 0l; // hack -> see datasource instance cache mechanism
        } else {
            return null;
        }
    }

    /**
     *
     * @param key
     */
    public void setScopeKey(Long key) {
        // Just to be ignored
    }

    /**
     * Get instance descriptor through its scope.
     *
     * @return the descriptor or null if this is a default instance
     */
    @JsonIgnore
    public VariableDescriptor getDescriptor() {
        if (this.isDefaultInstance()) {
            return null;
        } else {
            return this.getScope().getVariableDescriptor();
        }
    }

    /**
     * Get instance descriptor through its scope for regular instance or the default descriptor id
     * for default instances
     *
     * @return descriptor id
     */
    @Override
    public <T extends Mergeable> T getSerialisedParent() {
        // Special case: direct parent (the scope) is not known by the client
        return (T) this.findDescriptor();
    }

    /**
     * Dummy so that jaxb doesnt yell
     *
     * @param l
     */
    public void setDescriptorId(Long l) {
        // Dummy so that jaxb doesnt yell
    }

    /**
     * @return player if any
     */
    public Player getPlayer() {
        return player;
    }

    public GameModel getGameModel() {
        return gameModel;
    }

    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    /**
     * @return team if any
     */
    public Team getTeam() {
        return team;
    }

    public void setPlayer(Player player) {
        this.player = player;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    /**
     * @return the id
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     * @return the team or null if this instance doesn't belong to a team (belonging to the game for
     *         instance)
     */
    @JsonIgnore
    public TeamScope getTeamScope() {
        return teamScope;
    }

    /**
     * @param teamScope the teamScope to set
     */
    @JsonIgnore
    public void setTeamScope(TeamScope teamScope) {
        this.teamScope = teamScope;
    }

    /**
     * @return the playerScope
     */
    @JsonIgnore
    public PlayerScope getPlayerScope() {
        return playerScope;
    }

    /**
     * @param playerScope the playerScope to set
     */
    @JsonIgnore
    public void setPlayerScope(PlayerScope playerScope) {
        this.playerScope = playerScope;
    }

    /**
     * @return the defaultDescriptor
     */
    public VariableDescriptor getDefaultDescriptor() {
        return defaultDescriptor;
    }

    @JsonIgnore
    public boolean isDefaultInstance() {
        //instance without scope meads default instance
        return this.getScope() == null;
    }

    /**
     * return instance descriptor equals the instance is a default or effective one
     *
     * @return instance descriptor
     */
    public VariableDescriptor findDescriptor() {
        if (this.isDefaultInstance()) {
            return this.getDefaultDescriptor();
        } else {
            return this.getDescriptor();
        }
    }

    /**
     * @param defaultDescriptor the defaultDescriptor to set
     */
    public void setDefaultDescriptor(VariableDescriptor defaultDescriptor) {
        this.defaultDescriptor = defaultDescriptor;
    }

    /**
     * @return the gameModelScope of instance id gameModel scoped, null otherwise
     */
    public GameModelScope getGameModelScope() {
        return gameModelScope;
    }

    /**
     * @param gameModelScope the gameModelScope to set
     */
    public void setGameModelScope(GameModelScope gameModelScope) {
        this.gameModelScope = gameModelScope;
    }

    @Override
    public WithPermission getMergeableParent() {
        if (this.isDefaultInstance() && this.getDefaultDescriptor() != null) {
            return this.getDefaultDescriptor();
        } else {
            return this.getScope();
        }
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return this.isDefaultInstance() && this.getDefaultDescriptor() != null && this.getDefaultDescriptor().belongsToProtectedGameModel();
    }

    @Override
    public Visibility getInheritedVisibility() {
        if (this.isDefaultInstance() && this.getDefaultDescriptor() != null) {
            return this.getDefaultDescriptor().getVisibility();
        } else {
            return Visibility.INHERITED;
        }
    }

    /**
     *
     * @return string representation of the instance (class name, id, default or not, ...)
     */
    @Override
    public String toString() {
        if (this.getDefaultDescriptor() != null) {
            return "Default " + this.getClass().getSimpleName() + "( " + getId() + ") for " + this.getDefaultDescriptor().getName();
        } else if (this.getDescriptor() != null) {
            return this.getClass().getSimpleName() + "( " + getId() + ") for " + this.getDescriptor().getName();
        } else {
            return this.getClass().getSimpleName() + "( " + getId() + ") NO DESC";
        }
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        if (this.getScope() == null) {
            // Default Instance is only editable with edit permission on Descriptor
            return this.getDefaultDescriptor().getRequieredUpdatePermission(context);
        } else {

            if (context == RequestContext.EXTERNAL && getDescriptor().getIsolation() != Isolation.OPEN) {
                // only game superuser can update non-open variable in an external context
                return this.getDescriptor().getRequieredUpdatePermission(context);
            } else {
                if (this.getTeamScope() != null || this.getPlayerScope() != null) {
                    return WegasPermission.getAsCollection(this.getEffectiveOwner().getAssociatedWritePermission());
                } else if (this.getGameModelScope() != null) {
                    // anybody who has access to the game model can write global variables
                    return WegasPermission.getAsCollection(this.getEffectiveOwner().getAssociatedReadPermission());
                }
            }
        }

        return WegasPermission.FORBIDDEN;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        WegasPermission perm = null;
        if (this.getScope() == null) {
            if (this.getDefaultDescriptor() == null) {
                logger.error("ORPHAN VARIABLE INSTANCE: {}", this.getId());
                // almost due to cyclic PostLoad behaviour => ensure at least read right on the GM
                perm = this.getGameModel().getAssociatedReadPermission();
            } else {
                // Default instance case
                return this.getDefaultDescriptor().getGameModel().getRequieredReadPermission(context);
            }
        } else {
            // effectives instance cases

            if (context == RequestContext.EXTERNAL) {
                VariableDescriptor descriptor = this.getDescriptor();
                if (descriptor.getIsolation() == Isolation.HIDDEN) {
                    // Variable is hidden to players
                    perm = this.getTeam().getGame().getAssociatedWritePermission();
                }
            }

            if (perm == null) {
                if (this.getTeam() != null) {
                    if (this.getTeamScope().getBroadcastScope() == ScopeType.GameModelScope) {
                        perm = this.getTeam().getGame().getAssociatedReadPermission();
                    } else {
                        perm = this.getTeam().getAssociatedWritePermission();
                    }
                } else if (this.getPlayer() != null) {
                    if (this.getPlayerScope().getBroadcastScope() == ScopeType.TeamScope) {
                        perm = this.getPlayer().getTeam().getAssociatedWritePermission();
                    } else if (this.getPlayerScope().getBroadcastScope() == ScopeType.GameModelScope) {
                        perm = this.getPlayer().getGame().getAssociatedReadPermission();
                    } else {
                        perm = this.getPlayer().getAssociatedWritePermission();
                    }
                } else if (this.getGameModel() != null) {
                    // GameModel is set only for GameModel scoped instances
                    perm = this.getGameModel().getAssociatedReadPermission();
                }
            }
        }
        return WegasPermission.getAsCollection(perm);
    }

    /**
     * Will be printed in the schema so the client modify a schema entry depending on the instance
     * type
     */
    public static class IsDefaultInstance extends Equals {

        public IsDefaultInstance() {
            super(
                new WegasRefs.Field(VariableDescriptor.class, "defaultInstance"),
                new WegasRefs.Field(VariableInstance.class, null)
            );
        }
    }

    /**
     * Will be printed in the schema so the client modify a schema entry depending on the instance
     * type
     */
    public static class IsNotDefaultInstance extends Not {

        public IsNotDefaultInstance() {
            super(new IsDefaultInstance());
        }
    }
}
