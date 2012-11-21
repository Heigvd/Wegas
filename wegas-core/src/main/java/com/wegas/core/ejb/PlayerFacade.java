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
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
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
    private TeamFacade teamEntityFacade;

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
    public void create(Long teamId, Player player) {
        Team team = teamEntityFacade.find(teamId);
        team.addPlayer(player);
        em.flush();
        em.refresh(player);
        team.getGame().getGameModel().propagateDefaultInstance(false);
        //this.create(player);
    }

    public Player findByGameIdAndUserId(Long gameId, Long userId) throws PersistenceException {
        Query findByGameIdAndUserId = em.createNamedQuery("findPlayerByGameIdAndUserId");
        findByGameIdAndUserId.setParameter("gameId", gameId);
        findByGameIdAndUserId.setParameter("userId", userId);
        return (Player) findByGameIdAndUserId.getSingleResult();
    }

    public List<Player> findByGameId(Long gameId) {
        Query findByGameId = em.createNamedQuery("findPlayerByGameId");
        findByGameId.setParameter("gameId", gameId);
        return findByGameId.getResultList();
    }

    /**
     *
     */
    public PlayerFacade() {
        super(Player.class);
    }
}
