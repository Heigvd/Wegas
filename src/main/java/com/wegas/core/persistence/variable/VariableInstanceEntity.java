/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.ejb.Helper;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.primitive.NumberInstanceEntity;
import com.wegas.core.persistence.variable.primitive.StringInstanceEntity;
import com.wegas.core.persistence.variable.scope.AbstractScopeEntity;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstanceEntity;
import com.wegas.mcq.persistence.ChoiceInstanceEntity;
import com.wegas.mcq.persistence.QuestionInstanceEntity;
import com.wegas.messaging.persistence.variable.InboxInstanceEntity;
import javax.naming.NamingException;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
//@EntityListeners({VariableInstancePersistenceListener.class})
@Inheritance(strategy = InheritanceType.JOINED)
@XmlType(name = "VariableInstance")
//@JsonIgnoreProperties(value={"descriptorId"})
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "StringInstance", value = StringInstanceEntity.class),
    @JsonSubTypes.Type(name = "ListInstance", value = ListInstanceEntity.class),
    @JsonSubTypes.Type(name = "NumberInstance", value = NumberInstanceEntity.class),
    @JsonSubTypes.Type(name = "InboxInstance", value = InboxInstanceEntity.class),
    @JsonSubTypes.Type(name = "FSMInstance", value = StateMachineInstanceEntity.class),
    @JsonSubTypes.Type(name = "QuestionInstance", value = QuestionInstanceEntity.class),
    @JsonSubTypes.Type(name = "ChoiceInstance", value = ChoiceInstanceEntity.class)
})
abstract public class VariableInstanceEntity extends AbstractEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(VariableInstanceEntity.class);
    /**
     *
     */
    @Id
    @Column(name = "variableinstance_id")
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @ManyToOne
    @XmlTransient
    private AbstractScopeEntity scope;

    /**
     *
     * @return
     */
    @XmlTransient
    @Override
    public VariableInstanceEntity clone() {
        VariableInstanceEntity c = (VariableInstanceEntity) super.clone();
        return c;
    }

    /**
     * @return the id
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    @Override
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * @return the scope
     */
    @XmlTransient
    public AbstractScopeEntity getScope() {
        return scope;
    }

    /**
     * @param scope the scope to set
     */
    public void setScope(AbstractScopeEntity scope) {
        this.scope = scope;
    }

    /**
     * @return the scope
     */
    @XmlTransient
    public VariableDescriptorEntity getDescriptor() {
        return this.getScope().getVariableDescriptor();
    }

    /**
     *
     * @return
     */
    public Long getDescriptorId() {
        if (this.getScope() != null) {
            return this.getDescriptor().getId();
        } else {
            return new Long(-1);
        }
    }

    public void setDescriptorId(Long l) {
        // Dummy so that jaxb doesnt yell
    }

//    @PostPersist
    @PostUpdate
//    @PostRemove
    public void onInstanceUpdate() {
        if (this.getScope() == null) {                                          // If the instance has no scope, it means it's a default
            return;                                                             // default Instance and the updated event is not sent
        }
        try {
            Helper.lookupBy(VariableInstanceFacade.class).onVariableInstanceUpdate(this);
        }
        catch (NamingException ex) {
            logger.error("Error looking up VariableInstanceFacade");
        }
    }
}
