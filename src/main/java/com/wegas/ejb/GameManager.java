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

import com.wegas.persistence.game.GameEntity;
import com.wegas.persistence.game.GameModelEntity;
import java.util.Collection;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
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
@Stateless(name = "GameManagerBean")
@LocalBean
public class GameManager {

    private static final Logger logger = Logger.getLogger("GameManagerBean");
    /**
     * 
     */
    @EJB
    private AnonymousEntityManager aem;
    /**
     * 
     */
    @EJB
    private GameModelManager gmm;
    /**
     * 
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    public GameEntity getGame(Long gameId) {
        GameEntity find = em.find(GameEntity.class, gameId);
        return find;
    }

    public Collection<GameEntity> getGames(Long gameModelId) {
        GameModelEntity gm = gmm.getGameModel(gameModelId);
        return gm.getGames();
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
        /* @fixme*/
        //cq.where(cb.equal(game.get(GameEntity_.name), name));
        cq.where(cb.equal(game.get("token"), token));
        Query q = em.createQuery(cq);

        try {
            return (GameEntity) q.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    /**
     * Create a new game model
     * 
     * @param gm  the game model to propagateCreate
     */
    public void createGame(Long gameModelId, GameEntity g) {
        GameModelEntity gm = gmm.getGameModel(gameModelId);
        g.setGameModel(gm);
        aem.create(g);
    }

    /**
     * Update a game model
     * 
     * @param gmID 
     * @param theGameModel
     * @return  
     */
    public GameEntity updateGame(Long gameId, GameEntity newGame) {
        GameEntity g = this.getGame(gameId);
        g.merge(newGame);
        return g;
    }
}
