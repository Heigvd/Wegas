/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.*;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
import java.util.List;
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
     *
     * @param gameModelId
     * @param game
     */
    public void create(Long gameModelId, Game game) {
        if (this.findByToken(game.getToken()) != null
                || teamFacade.findByToken(game.getToken()) != null) {
            throw new WegasException("This token is already in use.");
        }
        GameModel gameModel = gameModelEntityFacade.find(gameModelId);
        gameModel.addGame(game);

        userFacade.getCurrentUser().getMainAccount().addPermission("Game:Edit:g" + game.getId());
        userFacade.getCurrentUser().getMainAccount().addPermission("Game:View:g" + game.getId());

        super.create(game);
    }

    @Override
    public Game update(final Long entityId, Game entity) {
        if ((this.findByToken(entity.getToken()) != null && this.findByToken(entity.getToken()).getId().compareTo(entity.getId()) != 0)
                || teamFacade.findByToken(entity.getToken()) != null) {
            throw new WegasException("This token is already in use.");
        }
        return super.update(entityId, entity);
    }

    @Override
    public void remove(Game entity) {
        for (Team t : entity.getTeams()) {
            teamFacade.remove(t);
        }
        super.remove(entity);

        userFacade.deleteUserPermissionByInstance("g" + entity.getId());
        userFacade.deleteAllRolePermissionsById("g" + entity.getId());
    }

    /**
     * Search for a game with token
     *
     * @param token
     * @return first game found or null
     */
    public Game findByToken(final String token) {
        final CriteriaBuilder cb = em.getCriteriaBuilder();
        final CriteriaQuery cq = cb.createQuery();
        final Root<Game> game = cq.from(Game.class);
        cq.where(cb.equal(game.get(Game_.token), token));
        Query q = em.createQuery(cq);
        try {
            return (Game) q.getSingleResult();
        } catch (NoResultException ex) {
            return null;
        }
    }

    public List<Game> findByGameModelId(final Long gameModelId, final String orderBy) {
        final Query getByGameId =
                em.createQuery("SELECT game FROM Game game WHERE game.gameModel.id = :gameModelId ORDER BY game.createdTime DESC");
        getByGameId.setParameter("gameModelId", gameModelId);
        //getByGameId.setParameter("orderBy", orderBy);
        return getByGameId.getResultList();
    }

    /**
     *
     * @return
     */
    public List<Game> findAll(String orderBy) {
        final Query getByGameId = em.createQuery("SELECT game FROM Game game ORDER BY game.createdTime DESC");
        //getByGameId.setParameter("orderBy", orderBy);
        return getByGameId.getResultList();
    }

    public List<Game> findRegisteredGames(final Long userId) {

        //final Query getByGameId = em.createQuery("SELECT game FROM Game game ORDER BY game.createdTime ASC");

        final User user = userFacade.find(userId);
        final List<Game> ret = new ArrayList<>();
        for (Player p : user.getPlayers()) {
            ret.add(p.getGame());
        }
        return ret;
    }

    public List<Game> findRegisteredGames(final Long userId, final Long gameModelId) {

        final List<Game> games = this.findRegisteredGames(userId);
        for (Iterator<Game> it = games.iterator(); it.hasNext();) {
            Game g = it.next();
            if (!g.getGameModel().getId().equals(gameModelId)) {
                it.remove();
            }
        }
        return games;
    }

    /**
     * Returns all public games
     *
     * @param userId
     * @return Collection<Game>
     */
    public Collection<Game> findPublicGames(final Long userId) {
        final String PREFIX = "Game:View:g";
        final Role pRolle = roleFacade.findByName("Public");
        final Collection<Game> registerdGame = this.findRegisteredGames(userId);
        Collection<Game> games = new ArrayList<>();

        for (String permission : pRolle.getPermissions()) {
            if (permission.startsWith(PREFIX)) {
                Game g = this.find(Long.parseLong(permission.replace(PREFIX, "")));
                if (!registerdGame.contains(g)) {                               // Only add games a player is not already registered in
                    this.em.detach(g);
                    g.setName(g.getGameModel().getName() + " : " + g.getName());
                    games.add(g);
                }
            }
        }
        return games;
    }

    /**
     *
     * @return
     */
    @Override
    public EntityManager getEntityManager() {
        return em;
    }
}
