/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.event.PlayerAction;
import com.wegas.core.exception.PersistenceException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.UserFacade;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class PlayerFacade extends AbstractFacadeImpl<Player> {

    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private StateMachineFacade stateMachineRunner;
    @EJB
    private TeamFacade teamFacade;
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    @Inject
    private Event<PlayerAction> playerActionEvent;

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
        teamFacade.joinTeam(teamId, player);
    }

    /**
     *
     * @param gameId
     * @param userId
     * @return
     * @throws PersistenceException
     */
    public Player findByGameIdAndUserId(final Long gameId, final Long userId) throws PersistenceException {
        final Query findByGameIdAndUserId = em.createNamedQuery("findPlayerByGameIdAndUserId");
        findByGameIdAndUserId.setParameter("gameId", gameId);
        findByGameIdAndUserId.setParameter("userId", userId);
        return (Player) findByGameIdAndUserId.getSingleResult();
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
     */
    public Player findByGameId(Long gameId) {
        Query getByGameId = em.createQuery("SELECT player FROM Player player WHERE player.team.game.id = :gameId");
        getByGameId.setParameter("gameId", gameId);
        return (Player) getByGameId.setMaxResults(1).getSingleResult();
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
     */
    public Player findByGameModelId(Long gameModelId) {
        Query getByGameId = em.createQuery("SELECT player FROM Player player WHERE player.team.game.gameModel.id = :gameModelId");
        getByGameId.setParameter("gameModelId", gameModelId);
        return (Player) getByGameId.setMaxResults(1).getSingleResult();
    }

    /**
     *
     * @param g
     * @return
     */
    public Player findCurrentPlayer(Game g) {
        return this.findByGameIdAndUserId(g.getId(), userFacade.getCurrentUser().getId());
    }

    /**
     *
     */
    public PlayerFacade() {
        super(Player.class);
    }
}
