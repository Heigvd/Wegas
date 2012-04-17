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
import com.wegas.core.persistence.variable.statemachine.TriggerInstanceEntity;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class TriggerInstanceFacade extends AbstractFacade<TriggerInstanceEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    
    public TriggerInstanceFacade() {
        super(TriggerInstanceEntity.class);
    }

    @Override
    protected EntityManager getEntityManager() {
        return this.em;
    }
    
    
    

}
