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

import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.TeamEntity;
import com.wegas.core.persistence.user.UserEntity;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class TeamFacade extends AbstractFacadeImpl<TeamEntity>  {

    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    @EJB
    private GameFacade gameFacade;
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     * @param gameId
     * @param t
     */
    public void create(Long gameId, TeamEntity t) {
        GameEntity g = gameFacade.find(gameId);
        g.addTeam(t);
        em.flush();
        em.refresh(t);
        g.getGameModel().propagateDefaultVariableInstance(false);
    }

    /**
     *
     * @param teamId
     * @param userId
     * @return
     */
    public PlayerEntity joinTeam(Long teamId, Long userId) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        UserEntity u = userFacade.find(userId);
        TeamEntity t = this.find(teamId);
        PlayerEntity p = new PlayerEntity();
        p.setUser(u);
        t.addPlayer(p);
        em.flush();
        em.refresh(p);
        t.getGame().getGameModel().propagateDefaultVariableInstance(false);
        return p;
    }

    /**
     *
     * @param teamId
     * @param p
     * @return
     */
    public PlayerEntity createPlayer(Long teamId, PlayerEntity p) {
        TeamEntity t = this.find(teamId);
        t.addPlayer(p);
        em.flush();
        em.refresh(p);
        t.getGame().getGameModel().propagateDefaultVariableInstance(false);
        return p;
    }

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
     */
    public TeamFacade() {
        super(TeamEntity.class);
    }
}
