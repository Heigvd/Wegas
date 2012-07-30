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
import com.wegas.core.persistence.game.Game_;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
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
        return (Player) findByRootGameModelId.getSingleResult();
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
