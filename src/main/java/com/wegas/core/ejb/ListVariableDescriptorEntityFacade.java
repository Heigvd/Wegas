/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.variabledescriptor.ListVariableDescriptorEntity;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class ListVariableDescriptorEntityFacade extends AbstractFacade<ListVariableDescriptorEntity> {
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
    public ListVariableDescriptorEntityFacade() {
        super(ListVariableDescriptorEntity.class);
    }
    
}
