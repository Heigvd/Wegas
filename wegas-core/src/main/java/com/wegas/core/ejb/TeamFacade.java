/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.internal.ResetEvent;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.GameAccount;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.persistence.NoResultException;
import javax.persistence.Query;
import javax.persistence.TypedQuery;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class TeamFacade extends BaseFacade<Team> {

    /**
     *
     */
    @EJB
    private GameFacade gameFacade;
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
     *
     * @param gameModelId
     * @param name
     * @return
     */
    private Team findByName(Long gameModelId, String name) throws WegasNoResultException {
        final TypedQuery<Team> query = getEntityManager().createNamedQuery("Team.findByGameIdAndName", Team.class);
        query.setParameter("gameId", gameModelId);
        query.setParameter("name", name);
        try {
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     *
     * @param gameId
     * @param t
     */
    public void create(Long gameId, Team t) {
        Game g = gameFacade.find(gameId);

        // @Hack If user is on a game account, use it as team name
        if (userFacade.getCurrentUser().getMainAccount() instanceof GameAccount) {
            //&& t.getName() == null ) {
            t.setName(((GameAccount) userFacade.getCurrentUser().getMainAccount()).getEmail());
        }

        try {
            this.findByName(gameId, t.getName());                               // If the provided name is already in use,
            t.setName(null);                                                    // reset so it will be generated
        } catch (WegasNoResultException e) {
            // Gotcha
        }

        int suffix = g.getTeams().size();
        String baseName = g.getShortName();
        while (t.getName() == null) {                                           // If no name is provided,
            String name = baseName + "-" + suffix;                              // generate one
            try {
                this.findByName(gameId, name);
                suffix++;
            } catch (WegasNoResultException e) {
                t.setName(name);
            }
        }

        g.addTeam(t);
        gameFacade.addRights(userFacade.getCurrentUser(), g);  // @fixme Should only be done for a player, but is done here since it will be needed in later requests to add a player

        getEntityManager().flush();
        g.getGameModel().propagateDefaultInstance(t);
    }

    /**
     *
     * @param entity
     */
    @Override
    public void remove(Team entity) {
        for (Player p : entity.getPlayers()) {
            playerFacade.remove(p);
        }
        for (VariableInstance i : this.getAssociatedInstances(entity)) {
            this.getEntityManager().remove(i);
        }
        this.getEntityManager().remove(entity);
    }

    /**
     *
     * @param team
     * @return
     */
    public List<VariableInstance> getAssociatedInstances(Team team) {
        Query findInstances = getEntityManager().createNamedQuery("findTeamInstances");
        findInstances.setParameter("teamid", team.getId());
        return findInstances.getResultList();
    }

    /**
     *
     */
    public TeamFacade() {
        super(Team.class);
    }


    /**
     * Reset a team
     * @param team the team to reset
     */
    public void reset(final Team team) {
        // Need to flush so prepersit events will be thrown (for example Game will add default teams)
        getEntityManager().flush();
        team.getGame().getGameModel().propagateDefaultInstance(team);
        getEntityManager().flush(); // DA FU    ()
        // Send an reset event (for the state machine and other)
        resetEvent.fire(new ResetEvent(team));
    }


    /**
     * Reset a team
     * @param teamId  id of the team to reset
     */
    public void reset(Long teamId) {
        this.reset(this.find(teamId));
    }
}
