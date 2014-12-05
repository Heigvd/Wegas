/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.UserFacade;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class PlayerFacade extends BaseFacade<Player> {

    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
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

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    /**
     *
     * @param teamId
     * @param player
     */
    public void create(final Long teamId, final Player player) {
        gameFacade.joinTeam(teamId, player);
    }

    /**
     *
     * @param gameId
     * @param userId
     * @return
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Player findByGameIdAndUserId(final Long gameId, final Long userId) throws WegasNoResultException {
        try {
            final Query findByGameIdAndUserId = em.createNamedQuery("findPlayerByGameIdAndUserId");
            findByGameIdAndUserId.setParameter("gameId", gameId);
            findByGameIdAndUserId.setParameter("userId", userId);
            return (Player) findByGameIdAndUserId.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     *
     * @param player
     * @return
     */
    public List<VariableInstance> getAssociatedInstances(final Player player) {
        final Query findPlayerInstance = em.createNamedQuery("findPlayerInstances");
        return findPlayerInstance.setParameter("playerid", player.getId()).getResultList();
    }

    /**
     *
     * @param player
     */
    @Override
    public void remove(final Player player) {
        List<VariableInstance> instances = this.getAssociatedInstances(player);
        this.em.remove(player);
        for (VariableInstance i : instances) {
            this.em.remove(i);
        }
    }

    /**
     *
     * @param gameId
     * @return
     */
    public List<Player> getByGameId(Long gameId) {
        Query findByGameId = em.createNamedQuery("findPlayerByGameId");
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
        Query getByGameId = em.createQuery("SELECT player FROM Player player WHERE player.team.game.id = :gameId");
        getByGameId.setParameter("gameId", gameId);
        try {
            return (Player) getByGameId.setMaxResults(1).getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     *
     * @param gameModelId
     * @return
     */
    public List<Player> getByGameModelId(Long gameModelId) {
        Query findByGameId = em.createQuery("SELECT player FROM Player player WHERE player.team.game.gameModel.id = :gameModelId");
        findByGameId.setParameter("gameModelId", gameModelId);
        return findByGameId.getResultList();
    }

    /**
     *
     * Returns the first available player in the target game model.
     *
     * @param gameModelId
     * @return
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Player findByGameModelId(Long gameModelId) throws WegasNoResultException {
        Query getByGameId = em.createQuery("SELECT player FROM Player player WHERE player.team.game.gameModel.id = :gameModelId");
        getByGameId.setParameter("gameModelId", gameModelId);
        try {
            return (Player) getByGameId.setMaxResults(1).getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     *
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
}
