/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.statemachine;

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptorEntity;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstanceEntity;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptorEntity;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
public class TriggerDescriptorFacade extends AbstractFacade<TriggerDescriptorEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    @EJB
    private GameModelFacade gameModelEntityFacade;

    public TriggerDescriptorFacade() {
        super(TriggerDescriptorEntity.class);
    }

    public void create(Long gameModelId, VariableDescriptorEntity triggerDescriptor) {
        this.gameModelEntityFacade.find(gameModelId).addVariableDescriptor(triggerDescriptor);
        em.persist(triggerDescriptor);
        //create initial state
        State tmpInitialState = ((StateMachineDescriptorEntity) triggerDescriptor).getStates().get(((StateMachineDescriptorEntity) triggerDescriptor).getInitialStateId());
        StateMachineInstanceEntity defaultInstance = (StateMachineInstanceEntity) triggerDescriptor.getDefaultVariableInstance();
        defaultInstance.setCurrentState(tmpInitialState);
        ((StateMachineDescriptorEntity) triggerDescriptor).setInitialStateId(tmpInitialState.getId());
        //reset instance
        triggerDescriptor.getScope().propagateDefaultVariableInstance(true);
        em.flush();
        em.refresh(triggerDescriptor);
    }

    @Override
    protected EntityManager getEntityManager() {
        return this.em;
    }
}
