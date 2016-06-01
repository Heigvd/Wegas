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
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.GameAccount;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.naming.NamingException;
import java.util.ArrayList;
import java.util.List;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class TeamFacade extends BaseFacade<Team> {

    private static final Logger logger = LoggerFactory.getLogger(TeamFacade.class);

    /**
     *
     */
    @EJB
    private GameFacade gameFacade;

    /**
     *
     */
    @EJB
    private TeamSingleton teamSingleton;

    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;

    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    @EJB
    private AccountFacade accountFacade;

    /**
     *
     */
    @Inject
    private Event<ResetEvent> resetEvent;

    /**
     * Get all account linked to team's players Account email addresses will be
     * altered (by hiding some parts) so they can be publicly displayed
     *
     * @param teamId
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
     * @param gameId
     * @param t
     * @return managed newly created team
     */
    public void create(Long gameId, Team t) {
        Game g = gameFacade.find(gameId);

        // @Hack If user is on a game account, use it as team name
        if (userFacade.getCurrentUser().getMainAccount() instanceof GameAccount) {
            //&& t.getName() == null ) {
            t.setName(((GameAccount) userFacade.getCurrentUser().getMainAccount()).getEmail());
        }
//        g.addTeam(t);
        teamSingleton.persistTeam(g, t);
        g = gameFacade.find(gameId);
        t = this.find(t.getId());
        gameFacade.addRights(userFacade.getCurrentUser(), g);  // @fixme Should only be done for a player, but is done here since it will be needed in later requests to add a player
        g.getGameModel().propagateDefaultInstance(t);

    }

    @Override
    public void create(Team entity) {
        getEntityManager().persist(entity);
        getEntityManager().find(Game.class, entity.getGame().getId()).addTeam(entity);
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
     * @return
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
        // Need to flush so prepersit events will be thrown (for example Game will add default teams)
        // F*cking flush
        //getEntityManager().flush();
        team.getGame().getGameModel().propagateDefaultInstance(team);
        // F*cking flush
        //getEntityManager().flush(); // DA FU    ()
        // Send an reset event (for the state machine and other)
        resetEvent.fire(new ResetEvent(team));
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
