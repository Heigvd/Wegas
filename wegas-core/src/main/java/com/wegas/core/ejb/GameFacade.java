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

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Game_;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.Role;
import com.wegas.exception.WegasException;
import java.util.ArrayList;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.NonUniqueResultException;
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
    /**
     *
     */
    @EJB
    private RoleFacade roleFacade;
    /**
     *
     */
    @EJB
    private TeamFacade teamFacade;
    /**
     *
     */
    @EJB
    private UserFacade userFacade;
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
     * Search for a game with token
     *
     * @param token
     * @return first game found or null
     */
    public Game findByToken(String token) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<Game> game = cq.from(Game.class);
        cq.where(cb.equal(game.get(Game_.token), token));
        Query q = em.createQuery(cq);
        Game g;
        try {
            g = (Game) q.getSingleResult();
        } catch (NoResultException ex) {
            g = null;
        } catch (NonUniqueResultException ex) {
            g = (Game) q.getResultList().get(0);
        }
        return g;                                     // If there is more than one game with this token, use the 1st one
        //return (Game) q.getSingleResult();
    }

    /**
     *
     * @param gameModelId
     * @param game
     */
    public void create(Long gameModelId, Game game) {
        if (game.getToken() == null || game.getToken().equals("") || this.findByToken(game.getToken()) != null || teamFacade.findByToken(game.getToken()) != null) {
            game.setToken(Helper.genToken(10));
        }
        GameModel gameModel = gameModelEntityFacade.find(gameModelId);
        gameModel.addGame(game);
        super.create(game);
    }

    @Override
    public Game update(final Long entityId, Game entity) {
        if (entity.getToken() == null || entity.getToken().equals("") || (this.findByToken(entity.getToken()) != null && this.findByToken(entity.getToken()).getId().compareTo(entity.getId()) != 0) || teamFacade.findByToken(entity.getToken()) != null) {
            entity.setToken(Helper.genToken(10));
        }
        return super.update(entityId, entity);
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
     *
     * @param userId
     * @return Collection<Game>
     */
    public Collection<Game> getPublicGames(Long userId) {

        Role pRolle = roleFacade.findByName("Public");
        Collection<Game> registerdGame = userFacade.registeredGames(userId);
        Collection<Game> games = new ArrayList<>();
        for (String permission : pRolle.getPermissions()) {
            String splitedPermission[] = permission.split(":g");
            String f = splitedPermission[1].substring(0, 1);
            if (!f.equals("m") && splitedPermission[0].equals("Game:View")) {
                Game g = this.find(Long.parseLong(splitedPermission[1]));
                this.em.detach(g);
                boolean registerd = false;
                for (Game aRegisterdG : registerdGame) {
                    if (g.equals(aRegisterdG)) {
                        registerd = true;
                        break;
                    }
                }
                if (!registerd) {
                    g.setName(g.getGameModel().getName() + " : " + g.getName());
                    games.add(g);
                }
            }
        }
        return games;
    }
}
