/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.GameEntity_;
import com.wegas.core.persistence.game.GameModelEntity;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
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
public class GameFacade extends AbstractFacade<GameEntity> {

    /**
     *
     */
    @EJB
    private GameModelFacade gameModelEntityFacade;
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public GameFacade() {
        super(GameEntity.class);
    }

    /**
     *
     * @param token
     * @return
     * @throws NoResultException
     */
    public GameEntity getGameByToken(String token) throws NoResultException {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<GameEntity> game = cq.from(GameEntity.class);
        cq.where(cb.equal(game.get(GameEntity_.name), token));
        Query q = em.createQuery(cq);
        return (GameEntity) q.getSingleResult();
    }

    /**
     *
     * @param gameModelId
     * @param game
     */
    public void create(Long gameModelId, GameEntity game) {
        GameModelEntity gameModel = gameModelEntityFacade.find(gameModelId);
        gameModel.addGame(game);
        this.create(game);
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
