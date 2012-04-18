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
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstanceEntity;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class FiniteStateMachineInstanceFacade extends AbstractFacade<StateMachineInstanceEntity> {

    @PersistenceContext(unitName="wegasPU")
    EntityManager em;

    public FiniteStateMachineInstanceFacade() {
        super(StateMachineInstanceEntity.class);
    }


    @Override
    protected EntityManager getEntityManager() {
        return this.em;
    }

}
