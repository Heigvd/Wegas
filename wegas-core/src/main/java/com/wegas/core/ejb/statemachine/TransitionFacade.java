/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.core.persistence.variable.statemachine.Transition;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 * Mainly used to query transitions, usefull for history
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
public class TransitionFacade extends AbstractFacadeImpl<Transition> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public TransitionFacade() {
        super(Transition.class);
    }

    @Override
    protected EntityManager getEntityManager() {
        return this.em;
    }
}
