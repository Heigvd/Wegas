/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.ejb.exception.PersistenceException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
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
public class TeamFacade extends AbstractFacadeImpl<Team> {

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
    public void create(Long gameId, Team t) {
        Game g = gameFacade.find(gameId);
        g.addTeam(t);
        em.flush();
        em.refresh(t);
        g.getGameModel().propagateDefaultInstance(false);
    }

    public Team findByToken(String token) throws PersistenceException {
        Query findByToken = em.createNamedQuery("findTeamByToken");
        findByToken.setParameter("token", token);
        return (Team) findByToken.getSingleResult();
    }

    /**
     *
     * @param teamId
     * @param userId
     * @return
     */
    public Player joinTeam(Team team, User user) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        Player p = new Player();
        p.setUser(user);
        this.joinTeam(team, p);
        return p;
    }

    public Player joinTeam(Long teamId, Long userId) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        return this.joinTeam(this.find(teamId), userFacade.find(userId));
    }

    public void joinTeam(Team team, Player player) {
        team.addPlayer(player);
        em.flush();
        em.refresh(player);
        team.getGame().getGameModel().propagateDefaultInstance(false);
    }

    /**
     *
     * @param teamId
     * @param p
     * @return
     */
    public Player createPlayer(Long teamId, Player p) {
        Team t = this.find(teamId);
        this.joinTeam(t, p);
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
        super(Team.class);
    }
}
