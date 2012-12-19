/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.ejb.exception.PersistenceException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Game_;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.persistence.Role;
import java.util.ArrayList;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
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
@LocalBean
public class GameFacade extends AbstractFacadeImpl<Game> {

    /**
     *
     */
    @EJB
    private GameModelFacade gameModelEntityFacade;

    @EJB
    private RoleFacade roleFacade;
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public GameFacade() {
        super(Game.class);
    }

    /**
     *
     * @param token
     * @return
     */
    public Game findByToken(String token)
            throws PersistenceException {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<Game> game = cq.from(Game.class);
        cq.where(cb.equal(game.get(Game_.token), token));
        Query q = em.createQuery(cq);
        return (Game) q.getResultList().get(0);                                     // If there is more than one game with this token, use the 1st one
        //return (Game) q.getSingleResult();
    }

    /**
     *
     * @param gameModelId
     * @param game
     */
    public void create(Long gameModelId, Game game) {
        GameModel gameModel = gameModelEntityFacade.find(gameModelId);
        gameModel.addGame(game);
        super.create(game);
    }

    /**
     *
     * @return
     */
    @Override
    public EntityManager getEntityManager() {
        return em;
    }

    /**
     * Metod return all public games
     * @return Collection<Game>
     */
    public Collection<Game> getPublicGames() {

        Role pRolle = roleFacade.findByName("Public");
        Collection<Game> games = new ArrayList<>();
        for (String permission : pRolle.getPermissions()){
                String splitedPermission[] = permission.split(":g");
                String f = splitedPermission[1].substring(0, 1);
                if (!f.equals("m")){
                    Game g = this.find(Long.parseLong(splitedPermission[1]));
                    this.em.detach(g);
                    g.setName(g.getGameModel().getName() + " : " + g.getName());
                    games.add(g);
                }
            }
        return games;
    }
}
