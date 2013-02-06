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
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.leaderway.persistence.ResourceInstance;
import com.wegas.leaderway.persistence.TaskInstance;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.messaging.persistence.InboxInstance;
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
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "StringInstance", value = StringInstance.class),
    @JsonSubTypes.Type(name = "ListInstance", value = ListInstance.class),
    @JsonSubTypes.Type(name = "NumberInstance", value = NumberInstance.class),
    @JsonSubTypes.Type(name = "InboxInstance", value = InboxInstance.class),
    @JsonSubTypes.Type(name = "FSMInstance", value = StateMachineInstance.class),
    @JsonSubTypes.Type(name = "QuestionInstance", value = QuestionInstance.class),
    @JsonSubTypes.Type(name = "ChoiceInstance", value = ChoiceInstance.class),
    @JsonSubTypes.Type(name = "ResourceInstance", value = ResourceInstance.class),
    @JsonSubTypes.Type(name = "TaskInstance", value = TaskInstance.class)
})
@NamedQueries({
    @NamedQuery(name = "findTeamInstances", query = "SELECT DISTINCT variableinstance FROM VariableInstance variableinstance WHERE variableinstance.teamScopeKey = :teamid"),
    @NamedQuery(name = "findPlayerInstances", query = "SELECT DISTINCT variableinstance FROM VariableInstance variableinstance WHERE variableinstance.playerScopeKey = :playerid")
})
//@JsonIgnoreProperties(value={"descriptorId"})
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
    @ManyToOne
    @XmlTransient
    @JsonIgnore
    private AbstractScope scope;

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
     * @return the id
     */
//    @Override
//    public Long getId() {
//        return id;
//    }
    /**
     * @return the scope
     */
    @XmlTransient
    public AbstractScope getScope() {
        return scope;
    }

    /**
     * @param scope the scope to set
     */
    public void setScope(AbstractScope scope) {
        this.scope = scope;
    }

    /**
     * @return the scope
     */
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
            return new Long(-1);
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
     */
    @Column(name = "teamvariableinstances_key", nullable = true, insertable = false, updatable = false)
    private Long teamScopeKey;

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
     */
    @Column(name = "variableinstances_key", nullable = true, insertable = false, updatable = false)
    private Long playerScopeKey;

    /**
     *
     * @return
     */
    @JsonIgnore
    public Long getPlayerScopeKey() {
        return playerScopeKey;
    }
}
