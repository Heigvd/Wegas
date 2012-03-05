/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.ejb;

import com.wegas.persistence.variabledescriptor.StringVariableDescriptorEntity;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class StringVariableDescriptorEntityFacade extends AbstractFacade<StringVariableDescriptorEntity> {
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
    public StringVariableDescriptorEntityFacade() {
        super(StringVariableDescriptorEntity.class);
    }
    
}