/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.ejb;

import com.wegas.persistence.game.GameModelEntity;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class GameModelEntityFacade extends AbstractFacade<GameModelEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     * @param gameModelId
     * @return
     */
    public GameModelEntity reset(Long gameModelId) {
        GameModelEntity gm = this.find(gameModelId);
        gm.propagateDefaultVariableInstance(true);
        em.flush();
        em.refresh(gm);
        return gm;
    }

    /**
     * 
     */
    public GameModelEntityFacade() {
        super(GameModelEntity.class);
    }

    /**
     * 
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }
}
