/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.internal.ResetEvent;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.UserFacade;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.*;
import java.util.List;
import javax.enterprise.event.Event;
import javax.inject.Inject;

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class PlayerFacade extends BaseFacade<Player> {

    /**
     *
     */
    @EJB
    private GameFacade gameFacade;

    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    @Inject
    private Event<ResetEvent> resetEvent;

    /**
     * @param teamId
     * @param player
     */
    public void create(final Long teamId, final Player player) {
        gameFacade.joinTeam(teamId, player);
    }

    /**
     * @param gameId
     * @param userId
     * @return
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Player findByGameIdAndUserId(final Long gameId, final Long userId) throws WegasNoResultException {
        try {
            final TypedQuery<Player> findByGameIdAndUserId = getEntityManager().createNamedQuery("findPlayerByGameIdAndUserId", Player.class);
            findByGameIdAndUserId.setParameter("gameId", gameId);
            findByGameIdAndUserId.setParameter("userId", userId);
            findByGameIdAndUserId.setParameter("status", Game.Status.LIVE);
            return findByGameIdAndUserId.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * @param player
     * @return
     */
    public List<VariableInstance> getAssociatedInstances(final Player player) {
        final Query findPlayerInstance = getEntityManager().createNamedQuery("findPlayerInstances");
        return findPlayerInstance.setParameter("playerid", player.getId()).getResultList();
    }

    /**
     * @param player
     */
    @Override
    public void remove(final Player player) {
        List<VariableInstance> instances = this.getAssociatedInstances(player);
        this.getEntityManager().remove(player);
        for (VariableInstance i : instances) {
            this.getEntityManager().remove(i);
        }
    }

    /**
     * @param gameId
     * @return
     */
    public List<Player> getByGameId(Long gameId) {
        Query findByGameId = getEntityManager().createNamedQuery("findPlayerByGameId");
        findByGameId.setParameter("gameId", gameId);
        return findByGameId.getResultList();
    }

    /**
     * Returns the first available player in the target game.
     *
     * @param gameId
     * @return
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Player findByGameId(Long gameId) throws WegasNoResultException {
        Query getByGameId = getEntityManager().createQuery("SELECT player FROM Player player WHERE player.team.game.id = :gameId");
        getByGameId.setParameter("gameId", gameId);
        try {
            return (Player) getByGameId.setMaxResults(1).getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * @param gameModelId
     * @return
     */
    public List<Player> getByGameModelId(Long gameModelId) {
        Query findByGameId = getEntityManager().createQuery("SELECT player FROM Player player WHERE player.team.game.gameModel.id = :gameModelId");
        findByGameId.setParameter("gameModelId", gameModelId);
        return findByGameId.getResultList();
    }

    /**
     * Returns the first available player in the target game model.
     *
     * @param gameModelId
     * @return
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Player findByGameModelId(Long gameModelId) throws WegasNoResultException {
        Query getByGameId = getEntityManager().createQuery("SELECT player FROM Player player WHERE player.team.game.gameModel.id = :gameModelId");
        getByGameId.setParameter("gameModelId", gameModelId);
        try {
            return (Player) getByGameId.setMaxResults(1).getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * Find a player for a live game
     *
     * @param id player's id
     * @return Player if found and game is live or null
     */
    public Player findLive(Long id) {
        Player player = this.find(id);
        if (player == null || !player.getGame().getStatus().equals(Game.Status.LIVE)) {
            return null;
        }
        return player;
    }

    /**
     * @param g
     * @return
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Player findCurrentPlayer(Game g) throws WegasNoResultException {
        return this.findByGameIdAndUserId(g.getId(), userFacade.getCurrentUser().getId());
    }

    /**
     *
     */
    public PlayerFacade() {
        super(Player.class);
    }

    /**
     * Reset a player
     * @param player the player to reset
     */
    public void reset(final Player player) {
        // Need to flush so prepersit events will be thrown (for example Game will add default teams)
        getEntityManager().flush();
        player.getGameModel().propagateDefaultInstance(player);
        getEntityManager().flush();
        // Send an reset event (for the state machine and other)
        resetEvent.fire(new ResetEvent(player));
    }


    /**
     * Reset a player
     * @param playerId  id of the player to reset
     */
    public void reset(Long playerId) {
        this.reset(this.find(playerId));
    }
}