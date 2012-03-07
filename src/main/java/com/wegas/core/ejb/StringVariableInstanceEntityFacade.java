/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.variableinstance.StringVariableInstanceEntity;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class StringVariableInstanceEntityFacade extends AbstractFacade<StringVariableInstanceEntity> {
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     * 
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    /**
     * 
     */
    public StringVariableInstanceEntityFacade() {
        super(StringVariableInstanceEntity.class);
    }
    
}