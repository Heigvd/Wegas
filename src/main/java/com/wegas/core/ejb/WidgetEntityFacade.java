/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.layout.WidgetEntity;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class WidgetEntityFacade extends AbstractFacade<WidgetEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    /**
     *
     */
    public WidgetEntityFacade() {
        super(WidgetEntity.class);
    }
}
