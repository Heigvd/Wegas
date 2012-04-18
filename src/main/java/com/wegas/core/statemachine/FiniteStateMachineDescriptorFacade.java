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
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptorEntity;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstanceEntity;
import java.util.HashMap;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class FiniteStateMachineDescriptorFacade extends AbstractFacade<StateMachineDescriptorEntity> {

    @PersistenceContext(unitName = "wegasPU")
    EntityManager em;

    public FiniteStateMachineDescriptorFacade() {
        super(StateMachineDescriptorEntity.class);
    }

    @Override
    protected EntityManager getEntityManager() {
        return this.em;
    }

    @Override
    public void create(StateMachineDescriptorEntity smDescriptor){
        State tmpInitialState = ((HashMap<Long, State>)smDescriptor.getStates()).get(smDescriptor.getInitialStateId());
        StateMachineInstanceEntity defaultInstance = (StateMachineInstanceEntity) smDescriptor.getDefaultVariableInstance();
        defaultInstance.setCurrentState(tmpInitialState);
        em.persist(smDescriptor);
        em.flush();
    }
}
