/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.GameEntity_;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class GameEntityFacade extends AbstractFacade<GameEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public GameEntityFacade() {
        super(GameEntity.class);
    }

    /**
     *
     * @param token
     * @return
     */
    public GameEntity getGameByToken(String token) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<GameEntity> game = cq.from(GameEntity.class);
        cq.where(cb.equal(game.get(GameEntity_.name), token));
        Query q = em.createQuery(cq);

        //try {
            return (GameEntity) q.getSingleResult();
        //} catch (NoResultException e) {
        //    return null;
        //}
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
