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
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
public class StateMachineDescriptorFacade extends AbstractFacade<StateMachineDescriptorEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    @EJB
    private GameModelFacade gameModelEntityFacade;

    public StateMachineDescriptorFacade() {
        super(StateMachineDescriptorEntity.class);
    }

    public void create(Long gameModelId, VariableDescriptorEntity smDescriptor) {
        //TODO: fix initial state in instances, redo all of this ***
        this.gameModelEntityFacade.find(gameModelId).addVariableDescriptor(smDescriptor);
        em.persist(smDescriptor);
        //create initial State
        State tmpInitialState = ((StateMachineDescriptorEntity) smDescriptor).getStates().get(((StateMachineDescriptorEntity) smDescriptor).getInitialStateId());
        StateMachineInstanceEntity defaultInstance = (StateMachineInstanceEntity) smDescriptor.getDefaultVariableInstance();
        defaultInstance.setCurrentState(tmpInitialState);
        ((StateMachineDescriptorEntity) smDescriptor).setInitialStateId(tmpInitialState.getId());
        //reset instance
        smDescriptor.getScope().propagateDefaultInstance(true);
        em.flush();
        em.refresh(smDescriptor);
    }

    @Override
    protected EntityManager getEntityManager() {
        return this.em;
    }
}
