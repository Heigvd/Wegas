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
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.EJBException;
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
        team.getGame().getGameModel().propagateDefaultVariableInstance(false);
        //this.create(player);
    }

    public Player findByGameIdAndUserId(Long gameId, Long userId) {
        Query findByRootGameModelId = em.createNamedQuery("findPlayerByGameIdAndUserId");
        findByRootGameModelId.setParameter("gameId", gameId);
        findByRootGameModelId.setParameter("userId", userId);

        try {
            return (Player) findByRootGameModelId.getSingleResult();
        }
        catch (NoResultException e) {
            throw (EJBException) new EJBException(e).initCause(e);
        }
    }

    public List<Player> findPlayersByGameId(Long gameId) {
        Query findByRootGameModelId = em.createNamedQuery("findPlayerByGameId");
        findByRootGameModelId.setParameter("gameId", gameId);
        return findByRootGameModelId.getResultList();
    }

    /**
     *
     */
    public PlayerFacade() {
        super(Player.class);
    }
}
