/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.naming.NamingException;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.TypedQuery;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class TeamFacade extends BaseFacade<Team> {

    private static final Logger logger = LoggerFactory.getLogger(TeamFacade.class);

    @Inject
    private PopulatorScheduler populatorScheduler;

    /**
     *
     */
    @EJB
    private GameFacade gameFacade;

    @EJB
    private AccountFacade accountFacade;

    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;

    /**
     * Get all account linked to team's players Account email addresses will be
     * altered (by hiding some parts) so they can be publicly displayed
     *
     * @param teamId
     *
     * @return List of abstractAccount which are players of the team
     */
    public List<AbstractAccount> getDetachedAccounts(Long teamId) {
        Team entity = this.find(teamId);
        ArrayList<AbstractAccount> accounts = accountFacade.findByTeam(entity);
        for (AbstractAccount account : accounts) {
            if (account instanceof JpaAccount) {
                JpaAccount ja = (JpaAccount) account;
                getEntityManager().detach(ja);
                ja.setEmail(ja.getEmail().replaceFirst("([^@]{1,4})[^@]*(@.*)", "$1****$2"));
            }
        }
        return accounts;
    }

    /**
     * Real world case : real user is joining a game
     *
     * @param gameId
     * @param t
     * @return 
     */
    public Team create(Long gameId, Team t) {
        /**
         * Be sure the new team exists in database before populate it
         */
        t = gameFacade.createAndCommit(gameId, t);
        t = this.find(t.getId());
        /**
         * the new thread must be able to retrieve the team to populate from database
         */
        populatorScheduler.scheduleCreation();
        this.detach(t);
        t = this.find(t.getId());
        return t;
    }

    /**
     * Internal use(eg. to create debug team)
     *
     * @param entity
     */
    @Override
    public void create(Team entity) {
        Game game = entity.getGame();
        game = gameFacade.find(game.getId());
        game.addTeam(entity);

        getEntityManager().persist(entity);
        gameModelFacade.propagateAndReviveDefaultInstances(game.getGameModel(), entity, true); // One-step team create (internal use)
        entity.setStatus(Status.LIVE);
    }

    public List<Team> findTeamsToPopulate() {
        TypedQuery<Team> query = this.getEntityManager().createNamedQuery("Team.findToPopulate", Team.class);
        return query.getResultList();
    }

    /**
     * @param entity
     */
    @Override
    public void remove(Team entity) {
        //for (Player p : entity.getPlayers()) {
        //    p.getUser().getPlayers().remove(p);
        //}
        //for (VariableInstance i : this.getAssociatedInstances(entity)) {
        //    this.getEntityManager().remove(i);
        //}
        entity.getGame().getTeams().remove(entity);
        this.getEntityManager().remove(entity);
    }

    /**
     * @param team
     *
     * @return
     *
     * @deprecated use JPA team.privateInstances
     */
    public List<VariableInstance> getAssociatedInstances(Team team) {
        return team.getPrivateInstances();
        //Query findInstances = getEntityManager().createNamedQuery("findTeamInstances");
        //findInstances.setParameter("teamid", team.getId());
        //return findInstances.getResultList();
    }

    /**
     *
     */
    public TeamFacade() {
        super(Team.class);
    }

    /**
     * Reset a team
     *
     * @param team the team to reset
     */
    public void reset(final Team team) {
        gameModelFacade.propagateAndReviveDefaultInstances(team.getGame().getGameModel(), team, false); // reset the team and all its players
        gameModelFacade.runStateMachines(team);
    }

    /**
     * Reset a team
     *
     * @param teamId id of the team to reset
     */
    public void reset(Long teamId) {
        this.reset(this.find(teamId));
    }

    /**
     * @return
     */
    public static TeamFacade lookup() {
        try {
            return Helper.lookupBy(TeamFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving team facade", ex);
            return null;
        }
    }
}
