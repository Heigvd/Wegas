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

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import java.util.HashMap;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.NonUniqueResultException;
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
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
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
        if (t.getToken() == null || t.getToken().equals("") || gameFacade.findByToken(t.getToken()) != null || this.findByToken(t.getToken()) != null) {
            t.setToken(Helper.genToken(10));
        }
        g.addTeam(t);
        em.flush();
        em.refresh(t);
        g.getGameModel().propagateDefaultInstance(false);
    }

    @Override
    public Team update(final Long gameId, Team entity) {
        if (entity.getToken() == null || entity.getToken().equals("") || (this.findByToken(entity.getToken()) != null && this.findByToken(entity.getToken()).getId().compareTo(entity.getId()) != 0) || gameFacade.findByToken(entity.getToken()) != null) {
            entity.setToken(Helper.genToken(10));
        }
        return super.update(gameId, entity);
    }

    /**
     * Search for a team with token
     *
     * @param token
     * @return first team found or null
     */
    public Team findByToken(String token) {
        Query findByToken = em.createNamedQuery("findTeamByToken");
        findByToken.setParameter("token", token);
        Team team;
        try {
            team = (Team) findByToken.getSingleResult();
        } catch (NoResultException ex) {
            team = null;
        } catch (NonUniqueResultException ex) {
            team = (Team) findByToken.getResultList().get(0);
        }
        return team;
    }

    @Override
    public void remove(Team entity) {
        List<VariableInstance> instances = this.getAssociatedInstances(entity);
        System.out.print(instances);
        this.em.remove(entity);
        for (VariableInstance i : instances) {
            this.em.remove(i);
        }
    }

    public List<VariableInstance> getAssociatedInstances(Team team) {
        Query findInstances = em.createNamedQuery("findTeamInstances");
        findInstances.setParameter("teamid", team.getId());
        return findInstances.getResultList();
    }

    /**
     *
     * @param team
     * @param user
     * @return
     */
    public Player joinTeam(Team team, User user) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        Player p = new Player();
        p.setUser(user);
        this.joinTeam(team, p);
        return p;
    }

    /**
     *
     * @param teamId
     * @param userId
     * @return
     */
    public Player joinTeam(Long teamId, Long userId) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        return this.joinTeam(this.find(teamId), userFacade.find(userId));
    }

    /**
     *
     * @param team
     * @param player
     */
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
