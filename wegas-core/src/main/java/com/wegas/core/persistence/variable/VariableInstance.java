/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.ObjectInstance;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.reviewing.persistence.PeerReviewInstance;
import javax.persistence.*;
////import javax.xml.bind.annotation.XmlTransient;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
//@EntityListeners({VariableInstancePersistenceListener.class})
@NamedQueries({
    //@NamedQuery(name = "findTeamInstances", query = "SELECT DISTINCT variableinstance FROM VariableInstance variableinstance WHERE variableinstance.teamScopeKey = :teamid"),
    //@NamedQuery(name = "findPlayerInstances", query = "SELECT DISTINCT variableinstance FROM VariableInstance variableinstance WHERE variableinstance.playerScopeKey = :playerid"),
    @NamedQuery(name = "findInstances", query = "SELECT DISTINCT variableinstance FROM VariableInstance variableinstance WHERE EXISTS "
            + "(SELECT player From Player player WHERE player.id = :playerid AND "
            + "(variableinstance.playerScopeKey = player.id OR variableinstance.teamScopeKey = player.teamId OR variableinstance.gameScopeKey = player.team.gameId))")
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
    @Index(columnList = "playerscope_id")
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
    @JsonSubTypes.Type(name = "PeerReviewInstance", value = PeerReviewInstance.class)
})
abstract public class VariableInstance extends AbstractEntity implements Broadcastable {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(VariableInstance.class);
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
     */
    @Column(name = "variableinstances_key", insertable = false, updatable = false, columnDefinition = "bigint")
    private Long playerScopeKey;

    @JoinColumn(name = "variableinstances_key", insertable = false, updatable = false)
    private Player player;

    /**
     *
     */
    @Column(name = "gamevariableinstances_key", insertable = false, updatable = false, columnDefinition = "bigint")
    private Long gameScopeKey;

    @JoinColumn(name = "gamevariableinstances_key", insertable = false, updatable = false)
    private Game game;
    /**
     *
     */
    @Column(name = "teamvariableinstances_key", insertable = false, updatable = false, columnDefinition = "bigint")
    private Long teamScopeKey;

    @JoinColumn(name = "teamvariableinstances_key", insertable = false, updatable = false)
    private Team team;

    /**
     *
     * @return
     */
    @Override
    public VariableInstance clone() {
        return (VariableInstance) super.clone();
    }

    @JsonIgnore
    public String getAudience() {
        if (this.teamScopeKey != null) {
            return this.getAudienceTokenForTeam(this.teamScopeKey);
        } else if (this.playerScopeKey != null) {
            return this.getAudienceTokenForPlayer(this.playerScopeKey);
        } else if (this.gameScopeKey != null) {
            return this.getAudienceTokenForGame(this.gameScopeKey);
        } else if (this.gameModelScope != null) {
            return this.getAudienceTokenForGameModel(this.getGameModelScope().getVariableDescriptor().getId());
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
        } else if (this.getDefaultDescriptor() != null){
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
        if (this.teamScopeKey != null) {
            return this.teamScope;
        } else if (this.playerScopeKey != null) {
            return this.playerScope;
        } else if (this.gameScopeKey != null) {
            return this.gameScope;
        } else if (this.gameModelScope != null) {
            return this.gameModelScope;
        } else {
            return null;
        }
    }

    /**
     *
     * @return
     */
    //@XmlTransient
    @JsonIgnore
    public VariableDescriptor getDescriptor() {
        if (this.getScope() != null) {
            return this.getScope().getVariableDescriptor();
        } else {
            return null;
        }
    }

    /**
     *
     * @return
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
     *
     * @param l
     */
    public void setDescriptorId(Long l) {
        // Dummy so that jaxb doesnt yell
    }

    /**
     * @return the id
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     *
     * @return
     */
    @JsonIgnore
    public Long getTeamScopeKey() {
        return teamScopeKey;
    }

    /**
     *
     * @param teamScopeKey
     */
    public void setTeamScopeKey(Long teamScopeKey) {
        this.teamScopeKey = teamScopeKey;
    }

    /**
     *
     * @return
     */
    @JsonIgnore
    public Long getPlayerScopeKey() {
        return playerScopeKey;
    }

    /**
     * @return the gameScope
     */
    @JsonIgnore
    public GameScope getGameScope() {
        return gameScope;
    }

    /**
     *
     * @param playerScopeKey
     */
    public void setPlayerScopeKey(Long playerScopeKey) {
        this.playerScopeKey = playerScopeKey;
    }

    /**
     *
     * @param gameScopeKey
     */
    public void setGameScopeKey(Long gameScopeKey) {
        this.gameScopeKey = gameScopeKey;
    }

    /**
     * @param gameScope the gameScope to set
     */
    @JsonIgnore
    public void setGameScope(GameScope gameScope) {
        this.gameScope = gameScope;
    }

    /**
     * @return the teamScope
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
     */
    @JsonIgnore
    public Long getGameScopeKey() {
        return gameScopeKey;
    }

    /**
     * @return the defaultDescriptor
     */
    public VariableDescriptor getDefaultDescriptor() {
        return defaultDescriptor;
    }

    /**
     *
     * @return
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
     * @return the gameModelScope
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

    /**
     *
     * @return
     */
    @Override
    public String toString() {
        if (this.defaultDescriptor != null) {
            return "Default " + this.getClass().getSimpleName() + "( " + getId() + ") for " + this.defaultDescriptor.getName();
        } else if (this.getDescriptor() != null) {
            return this.getClass().getSimpleName() + "( " + getId() + ") for " + this.getDescriptor().getName();
        } else {
            return this.getClass().getSimpleName() + "( " + getId() + ") NO DESC";
        }
    }
}
