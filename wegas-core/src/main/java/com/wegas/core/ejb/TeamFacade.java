
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.api.TeamFacadeI;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.util.ActAsPlayer;
import java.util.List;
import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.persistence.NoResultException;
import jakarta.persistence.TypedQuery;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class TeamFacade extends BaseFacade<Team> implements TeamFacadeI {

    @Inject
    private PopulatorScheduler populatorScheduler;

    /**
     *
     */
    @Inject
    private GameFacade gameFacade;

    @Inject
    private AccountFacade accountFacade;

    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private StateMachineFacade stateMachineFacade;

    /**
     * Get all account linked to team's players
     *
     * @param teamId
     *
     * @return List of abstractAccount which are players of the team
     */
    public List<AbstractAccount> getInTeamAccounts(Long teamId) {
        Team entity = this.find(teamId);
        return accountFacade.findByTeam(entity);
    }

    public String findUniqueNameForTeam(Game g, String baseName) {
        boolean found = false;
        String uniqueName = baseName;
        TypedQuery<Team> query = this.getEntityManager().createNamedQuery("Team.findByGameIdAndName", Team.class);
        query.setParameter("gameId", g.getId());
        long suffix = 1;

        do {
            query.setParameter("name", uniqueName);
            try {
                query.getSingleResult();
                // if a team with the name already exists:
                suffix++;
                uniqueName = baseName + " (" + suffix + ")";
            } catch (NoResultException ex) {
                // no team with such name exists
                found = true;
            }
        } while (!found);

        return uniqueName;
    }

    /**
     * Real world case : real user is joining a game
     *
     * @param gameId
     * @param t
     *
     * @return
     */
    public Team create(Long gameId, Team t) {
        /**
         * Be sure the new team exists in database before populate it
         */
        Long teamId = gameFacade.createAndCommit(gameId, t);
        this.find(teamId);
        /**
         * the new thread must be able to retrieve the team to populate from database
         */
        populatorScheduler.scheduleCreation();
        this.detach(t);
        t = this.find(t.getId());
        requestManager.setCurrentTeam(t);
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
        entity.setStatus(Status.LIVE);

        getEntityManager().persist(entity);
        Player aLivePlayer = entity.getAnyLivePlayer();
        try (ActAsPlayer a = requestManager.actAsPlayer(aLivePlayer)) {
            gameModelFacade.propagateAndReviveDefaultInstances(game.getGameModel(), entity, true); // One-step team create (internal use)
        }
    }

    /**
     * Internal use(eg. to create debug team)
     *
     * @param entity
     */
    public void createForSurvey(Team entity) {
        Game game = entity.getGame();
        game = gameFacade.find(game.getId());
        game.addTeam(entity);
        entity.setStatus(Status.SURVEY);

        getEntityManager().persist(entity);
        Player player = entity.getAnySurveyPlayer();

        try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
            gameModelFacade.propagateAndReviveDefaultInstances(game.getGameModel(), entity, true); // One-step team create (internal use)
        }
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
     * @return all instances which belongs to the team
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
        stateMachineFacade.runStateMachines(team, true);
    }

    /**
     * Reset a team
     *
     * @param teamId id of the team to reset
     */
    public void reset(Long teamId) {
        this.reset(this.find(teamId));
    }
}
