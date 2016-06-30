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
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.*;
import com.wegas.core.persistence.variable.scope.*;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.resourceManagement.persistence.BurndownInstance;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.reviewing.persistence.PeerReviewInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.eclipse.persistence.annotations.OptimisticLocking;

////import javax.xml.bind.annotation.XmlTransient;
/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@NamedQueries({
    //@NamedQuery(name = "findTeamInstances", query = "SELECT DISTINCT variableinstance FROM VariableInstance variableinstance WHERE variableinstance.teamScopeKey = :teamid"),
    //@NamedQuery(name = "findPlayerInstances", query = "SELECT DISTINCT variableinstance FROM VariableInstance variableinstance WHERE variableinstance.playerScopeKey = :playerid"),
    @NamedQuery(name = "findInstances", query = "SELECT DISTINCT variableinstance FROM VariableInstance variableinstance WHERE EXISTS "
            + "(SELECT player From Player player WHERE player.id = :playerid AND "
            + "(variableinstance.player.id = player.id OR variableinstance.team.id = player.team.id OR variableinstance.game = player.team.game.id))")
})

/*@Indexes(value = { // JPA 2.0 eclipse link extension TO BE REMOVED

 @Index(name = "index_variableinstance_gamescope_id", columnNames = {"gamescope_id"}),
 @Index(name = "index_variableinstance_teamscope_id", columnNames = {"teamscope_id"}),
 @Index(name = "index_variableinstance_playerscope_id", columnNames = {"playerscope_id"})
 })*/

 /* JPA2.1 (GlassFish4) Indexes */
@Table(indexes = {
    @Index(columnList = "gamescope_id"),
    @Index(columnList = "teamscope_id"),
    @Index(columnList = "playerscope_id"),
    @Index(columnList = "variableinstances_key"),
    @Index(columnList = "teamvariableinstances_key"),
    @Index(columnList = "gamevariableinstances_key")
})

//@JsonIgnoreProperties(value={"descriptorId"})
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "StringInstance", value = StringInstance.class),
    @JsonSubTypes.Type(name = "TextInstance", value = TextInstance.class),
    @JsonSubTypes.Type(name = "BooleanInstance", value = BooleanInstance.class),
    @JsonSubTypes.Type(name = "ListInstance", value = ListInstance.class),
    @JsonSubTypes.Type(name = "NumberInstance", value = NumberInstance.class),
    @JsonSubTypes.Type(name = "InboxInstance", value = InboxInstance.class),
    @JsonSubTypes.Type(name = "FSMInstance", value = StateMachineInstance.class),
    @JsonSubTypes.Type(name = "QuestionInstance", value = QuestionInstance.class),
    @JsonSubTypes.Type(name = "ChoiceInstance", value = ChoiceInstance.class),
    @JsonSubTypes.Type(name = "ResourceInstance", value = ResourceInstance.class),
    @JsonSubTypes.Type(name = "TaskInstance", value = TaskInstance.class),
    @JsonSubTypes.Type(name = "ObjectInstance", value = ObjectInstance.class),
    @JsonSubTypes.Type(name = "PeerReviewInstance", value = PeerReviewInstance.class),
    @JsonSubTypes.Type(name = "BurndownInstance", value = BurndownInstance.class)
})
@OptimisticLocking(cascade = true)
abstract public class VariableInstance extends AbstractEntity implements Broadcastable {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(VariableInstance.class);

    @Version
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
    @Column(name = "variableinstance_id")
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     *
     */
    @ManyToOne
    @JsonIgnore
    private GameScope gameScope;

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
    @OneToOne(fetch = FetchType.LAZY, mappedBy = "variableInstance")
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
     * @Column(name = "variableinstances_key", insertable = false, updatable =
     * false, columnDefinition = "bigint") private Long playerScopeKey;
     */
    /**
     *
     */
    @JoinColumn(name = "variableinstances_key", insertable = false, updatable = false)
    @ManyToOne
    @JsonIgnore
    private Player player;
    /**
     *
     * @Column(name = "gamevariableinstances_key", insertable = false, updatable
     * = false, columnDefinition = "bigint") private Long gameScopeKey;
     */
    /**
     *
     */
    @JoinColumn(name = "gamevariableinstances_key", insertable = false, updatable = false)
    @ManyToOne
    @JsonIgnore
    private Game game;
    /**
     *
     * @Column(name = "teamvariableinstances_key", insertable = false, updatable
     * = false, columnDefinition = "bigint") private Long teamScopeKey;
     */
    /**
     *
     */
    @JoinColumn(name = "teamvariableinstances_key", insertable = false, updatable = false)
    @ManyToOne
    @JsonIgnore
    private Team team;

    @Override
    public VariableInstance clone() {
        return (VariableInstance) super.clone();
    }

    @JsonIgnore
    public String getAudience() {
        if (this.getTeam() != null) {
            return Helper.getAudienceTokenForTeam(this.getTeam().getId());
        } else if (this.getPlayer() != null) {
            return Helper.getAudienceTokenForPlayer(this.getPlayer().getId());
        } else if (this.getGame() != null) {
            return Helper.getAudienceTokenForGame(this.getGame().getId());
        } else if (this.gameModelScope != null) {
            return Helper.getAudienceTokenForGameModel(this.getGameModelScope().getVariableDescriptor().getGameModelId());
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

    /**
     *
     * //@PostUpdate // @PostRemove // @PostPersist public void
     * onInstanceUpdate() { // If the instance has no scope, it means it's a
     * default if (this.getScope() != null) { //
     * RequestFacade.lookup().getRequestManager().addUpdatedInstance(this); } }
     */
    /**
     * @return the scope
     */
    //@XmlTransient
    @JsonIgnore
    public AbstractScope getScope() {
        if (this.getTeamScope() != null) {
            return this.getTeamScope();
        } else if (this.getPlayerScope() != null) {
            return this.getPlayerScope();
        } else if (this.getGameScope() != null) {
            return this.getGameScope();
        } else if (this.getGameModelScope() != null) {
            return this.getGameModelScope();
        } else {
            return null;
        }
    }

    /**
     * Get instance descriptor through its scope.
     *
     * @return the descriptor or null if this is a default instance
     */
    @JsonIgnore
    public VariableDescriptor getDescriptor() {
        if (this.getScope() != null) {
            return this.getScope().getVariableDescriptor();
        } else {
            return null;
        }
    }

    /**
     * Get instance descriptor's id through its scope
     *
     * @return descriptor id of -1 if this is a default instance
     */
    @JsonView(Views.IndexI.class)
    public Long getDescriptorId() {
        if (this.getScope() != null) {
            return this.getDescriptor().getId();
        } else {
            return -1L;
        }
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

    /**
     * @return game if any
     */
    public Game getGame() {
        return game;
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

    public void setGame(Game game) {
        this.game = game;
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
     * Id of the team owning the instance
     *
     * @return team's id or null if instance is not a team instance
     * @JsonIgnore public Long getTeamScopeKey() { return teamScopeKey; }
     */
    /**
     * @param teamScopeKey public void setTeamScopeKey(Long teamScopeKey) {
     *                     this.teamScopeKey = teamScopeKey; }
     */
    /**
     * Id of player owning the instance
     *
     * @return player's id or null if this is not a player instance
     * @JsonIgnore public Long getPlayerScopeKey() { return playerScopeKey; }
     */
    /**
     *
     * @return the gameScope or null if this instance doesn't belong to a game
     */
    @JsonIgnore
    public GameScope getGameScope() {
        return gameScope;
    }

    /**
     * @param playerScopeKey public void setPlayerScopeKey(Long playerScopeKey)
     *                       { this.playerScopeKey = playerScopeKey; }
     */
    /**
     * @param gameScopeKey public void setGameScopeKey(Long gameScopeKey) {
     *                     this.gameScopeKey = gameScopeKey; }
     */
    /**
     * @param gameScope the gameScope to set
     */
    @JsonIgnore
    public void setGameScope(GameScope gameScope) {
        this.gameScope = gameScope;
    }

    /**
     * @return the team or null if this instance doesn't belong to a team
     *         (belonging to the game for instance)
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
     * @return the gameScopeKey
     * @JsonIgnore public Long getGameScopeKey() { return gameScopeKey; }
     */
    /**
     * return instance descriptor equals the instance is a default or effective
     * one
     *
     * @return instance descriptor
     * @deprecated {@link #findDescriptor()}
     */
    @JsonIgnore
    public VariableDescriptor getDescriptorOrDefaultDescriptor() {
        return this.findDescriptor();
    }

    /**
     * @return the defaultDescriptor
     */
    public VariableDescriptor getDefaultDescriptor() {
        return defaultDescriptor;
    }

    /**
     * return instance descriptor equals the instance is a default or effective
     * one
     *
     * @return instance descriptor
     */
    public VariableDescriptor findDescriptor() {
        if (this.getScope() != null) {
            return this.getDescriptor();
        } else {
            return this.getDefaultDescriptor();
        }
    }

    /**
     * @param defaultDescriptor the defaultDescriptor to set
     */
    public void setDefaultDescriptor(VariableDescriptor defaultDescriptor) {
        this.defaultDescriptor = defaultDescriptor;
    }

    /**
     * @return the gameModelScope of instance id gameModel scoped, null
     *         otherwise
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
    public void merge(AbstractEntity other) {
        if (other instanceof VariableInstance) {
            VariableInstance instance = (VariableInstance) other;
            this.setVersion(instance.getVersion());
        }
    }

    /**
     *
     * @return string representation of the instance (class name, id, default or
     *         not, ...)
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
    public void updateCacheOnDelete() {
        // do not update anything for default instances
        if (this.getDefaultDescriptor() == null) {
            VariableDescriptor variableDescriptor = VariableDescriptorFacade.lookup().find(this.getScope().getVariableDescriptor().getId());

            // if variable descriptor does not exists, it means it has been removed too
            if (variableDescriptor != null) {

                // When a player/team/game is removed, its instances are deleted too (JPA Casacding)
                // Scopes for each deleted variables shall be updated too
                AbstractScope scope = variableDescriptor.getScope();

                if (scope != null) {
                    if (scope instanceof PlayerScope) {
                        scope.getVariableInstances().remove(this.getPlayer());
                    } else if (scope instanceof TeamScope) {
                        scope.getVariableInstances().remove(this.getTeam());
                    } else if (scope instanceof GameScope) {
                        scope.getVariableInstances().remove(this.getGame());
                    } else if (this.gameModelScope != null) {
                    }
                }
            }

            AbstractScope scope = this.getScope();

            if (scope != null) {
                // When a descriptor is deleted, all of its instances are removed too (JPA cascading)
                // References to those instances shall be remove from owner private instances list
                if (scope instanceof PlayerScope) {
                    Player find = PlayerFacade.lookup().find(this.getPlayer().getId());
                    if (find != null) {
                        find.getPrivateInstances().remove(this);
                    }
                } else if (scope instanceof TeamScope) {
                    Team find = TeamFacade.lookup().find(this.getTeam().getId());
                    if (find != null) {
                        find.getPrivateInstances().remove(this);
                    }
                } else if (scope instanceof GameScope) {
                    Game find = GameFacade.lookup().find(this.getGame().getId());
                    if (find != null) {
                        find.getPrivateInstances().remove(this);
                    }
                } else if (this.gameModelScope != null) {
                    // noop
                }
            }
        }
    }
}
