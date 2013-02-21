/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Game_;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.Role;
import java.util.ArrayList;
import java.util.Collection;
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

        userFacade.deleteAccountPermissionByInstance("g" + entity.getId());
        userFacade.deleteRolePermissionsByInstance("g" + entity.getId());
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
     * Returns all public games
     *
     * @param userId
     * @return Collection<Game>
     */
    public Collection<Game> getPublicGames(final Long userId) {
        final String PREFIX = "Game:View:g";
        final Role pRolle = roleFacade.findByName("Public");
        final Collection<Game> registerdGame = userFacade.registeredGames(userId);
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
}
