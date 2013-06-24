/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.leaderway.persistence.ResourceInstance;
import com.wegas.leaderway.persistence.TaskInstance;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.mononpoly.persistence.ObjectInstance;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.codehaus.jackson.map.annotate.JsonView;
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
    @NamedQuery(name = "findTeamInstances", query = "SELECT DISTINCT variableinstance FROM VariableInstance variableinstance WHERE variableinstance.teamScopeKey = :teamid"),
    @NamedQuery(name = "findPlayerInstances", query = "SELECT DISTINCT variableinstance FROM VariableInstance variableinstance WHERE variableinstance.playerScopeKey = :playerid")
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
    @JsonSubTypes.Type(name = "ObjectInstance", value = ObjectInstance.class)
})
abstract public class VariableInstance extends AbstractEntity {

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
//    @ManyToOne(fetch = FetchType.LAZY)
//    @XmlTransient
//    @JsonIgnore
//    private AbstractScope scope;
    //@ManyToOne
    //private GameModelScope gameModelScope;
    @ManyToOne
    @JsonIgnore
    private GameScope gameScope;
    @ManyToOne
    @JsonIgnore
    private TeamScope teamScope;
    @ManyToOne
    @JsonIgnore
    private PlayerScope playerScope;
    /**
     *
     */
    @Column(name = "variableinstances_key", insertable = false, updatable = false, columnDefinition = "bigint")
    private Long playerScopeKey;
    /**
     *
     */
    @Column(name = "gamevariableinstances_key", insertable = false, updatable = false, columnDefinition = "bigint")
    private Long gameScopeKey;
    /**
     *
     */
    @Column(name = "teamvariableinstances_key", insertable = false, updatable = false, columnDefinition = "bigint")
    private Long teamScopeKey;

    /**
     *
     * @return
     */
    @Override
    public VariableInstance clone() {
        return (VariableInstance) super.clone();
    }

    /**
     *
     */
    @PostUpdate
//    @PostRemove
//    @PostPersist
    public void onInstanceUpdate() {
        if (this.getScope() == null) {                                          // If the instance has no scope, it means it's a default
            return;                                                             // default Instance and the updated event is not sent
        }
        RequestFacade.lookup().getRequestManager().addUpdatedInstance(this);
    }

    /**
     * @return the scope
     */
    @XmlTransient
    @JsonIgnore
    public AbstractScope getScope() {
        if (this.gameScope != null) {
            return this.gameScope;
        } else if (this.teamScope != null) {
            return this.teamScope;
        } else if (this.playerScope != null) {
            return this.playerScope;
        } else {
            return null;
        }
    }

    @XmlTransient
    @JsonIgnore
    public VariableDescriptor getDescriptor() {
        return this.getScope().getVariableDescriptor();
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
            return Long.valueOf(-1);
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

}
