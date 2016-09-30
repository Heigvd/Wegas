/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.event.internal.ResetEvent;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.naming.NamingException;
import javax.persistence.NoResultException;
import javax.persistence.Query;
import javax.persistence.TypedQuery;
import java.util.List;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class PlayerFacade extends BaseFacade<Player> {

    private static final Logger logger = LoggerFactory.getLogger(PlayerFacade.class);

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
     * @param team
     * @param user
     */
    public void create(final Team team, final User user) {
        //gameFacade.joinTeam(getEntityManager().find(Team.class, team.getId()), user);
        gameFacade.joinTeam(team, user);
    }

    /**
     * Look for a user player withing game
     *
     * @param gameId game id
     * @param userId user id
     * @return the player owned by user linked to the game
     * @throws WegasNoResultException if not player was found
     */
    public Player findByGameIdAndUserId(final Long gameId, final Long userId) throws WegasNoResultException {
        try {
            final TypedQuery<Player> findByGameIdAndUserId = getEntityManager().createNamedQuery("Player.findPlayerByGameIdAndUserId", Player.class);
            findByGameIdAndUserId.setParameter("gameId", gameId);
            findByGameIdAndUserId.setParameter("userId", userId);
            return findByGameIdAndUserId.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * @param gameId
     * @param userId
     * @return the player owned by user linked to the game or null if not found
     */
    public Player checkExistingPlayer(final Long gameId, final Long userId) {
        // TODO REPLACE EACH USAGE with findByGameIdAndUserId
        try {
            final TypedQuery<Player> findByGameIdAndUserId = getEntityManager().createNamedQuery("Player.findPlayerByGameIdAndUserId", Player.class);
            findByGameIdAndUserId.setParameter("gameId", gameId);
            findByGameIdAndUserId.setParameter("userId", userId);
            return findByGameIdAndUserId.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    /**
     * @param teamId
     * @param userId
     * @return the player owned by user who is member of the game
     */
    public Player checkExistingPlayerInTeam(final Long teamId, final Long userId) {
        try {
            final TypedQuery<Player> find = getEntityManager().createNamedQuery("Player.findPlayerByTeamIdAndUserId", Player.class);
            find.setParameter("teamId", teamId);
            find.setParameter("userId", userId);
            return find.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    /**
     * @param player
     * @return all player instances
     * @deprecated please use {@link Player#getPrivateInstances() }
     */
    public List<VariableInstance> getAssociatedInstances(final Player player) {
        return player.getPrivateInstances();
        //final Query findPlayerInstance = getEntityManager().createNamedQuery("findPlayerInstances");
        //return findPlayerInstance.setParameter("playerid", player.getId()).getResultList();
    }

    /**
     * Get all instances a player as access to
     *
     * @param playerId the player to get instances for
     * @return List of instances
     */
    public List<VariableInstance> getInstances(final Long playerId) {
        final TypedQuery<VariableInstance> findPlayerInstance = getEntityManager().createNamedQuery("VariableInstance.findInstancesForPlayer", VariableInstance.class);
        return findPlayerInstance.setParameter("playerid", playerId).getResultList();
    }

    @Override
    public void create(Player entity) {
        getEntityManager().persist(entity);
        getEntityManager().find(Team.class, entity.getTeam().getId()).addPlayer(entity);
        if (entity.getUser() != null) {
            getEntityManager().find(User.class, entity.getUser().getId()).getPlayers().add(entity);
        }
    }

    /**
     * @param player
     */
    @Override
    public void remove(final Player player) {
        //List<VariableInstance> instances = this.getAssociatedInstances(player);
        player.getTeam().getPlayers().remove(player);
        if (player.getUser() != null) {
            player.getUser().getPlayers().remove(player);
        }

        this.getEntityManager().remove(player);

        //for (VariableInstance i : instances) {
        //    this.getEntityManager().remove(i);
        //}
    }

    /**
     * @param gameId
     * @return all players in the game
     */
    public List<Player> getByGameId(Long gameId) {
        TypedQuery<Player> findByGameId = getEntityManager().createNamedQuery("Player.findPlayerByGameId", Player.class);
        findByGameId.setParameter("gameId", gameId);
        return findByGameId.getResultList();
    }

    /**
     * Returns the first available player in the target game.
     *
     * @param gameId
     * @return a player from the game
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Player findByGameId(Long gameId) throws WegasNoResultException {
        Query getByGameId = getEntityManager().createQuery("SELECT player FROM Player player WHERE player.team.game.id = :gameId "
                + "ORDER BY type(player.team) desc"); // Debug player comes last
        getByGameId.setParameter("gameId", gameId);
        try {
            return (Player) getByGameId.setMaxResults(1).getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * @param gameModelId
     * @return all players from all teams and all games from gameModel
     */
    public List<Player> getByGameModelId(Long gameModelId) {
        TypedQuery<Player> findByGameId = getEntityManager().createQuery("SELECT player FROM Player player WHERE player.team.game.gameModel.id = :gameModelId", Player.class);
        findByGameId.setParameter("gameModelId", gameModelId);
        return findByGameId.getResultList();
    }

    /**
     * Returns the first available player in the target game model.
     *
     * @param gameModelId
     * @return any player in the game model
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
     * Find a player test player
     *
     * @param id player's id
     * @return Player if found and game is a debug one, null otherwise
     */
    public Player findTestPlayer(Long id) {
        Player player = this.find(id);
        if (player == null || !(player.getGame() instanceof DebugGame)) {
            return null;
        }
        return player;
    }

    /**
     * @param g
     * @return currentUser player for given game
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
     *
     * @param player the player to reset
     */
    public void reset(final Player player) {
        // Need to flush so prepersit events will be thrown (for example Game will add default teams)
        // F*cking flush
        //getEntityManager().flush();
        player.getGameModel().propagateDefaultInstance(player);
        // F*cking flush
        //getEntityManager().flush();
        // Send an reset event (for the state machine and other)
        resetEvent.fire(new ResetEvent(player));
    }

    /**
     * Reset a player
     *
     * @param playerId id of the player to reset
     */
    public void reset(Long playerId) {
        this.reset(this.find(playerId));
    }

    /**
     * @return Looked-up EJB
     */
    public static PlayerFacade lookup() {
        try {
            return Helper.lookupBy(PlayerFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving player facade", ex);
            return null;
        }
    }
}
