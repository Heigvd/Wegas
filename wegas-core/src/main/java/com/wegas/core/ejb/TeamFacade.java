/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.PlayerAction;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import org.apache.shiro.SecurityUtils;

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
    private PlayerFacade playerFacade;
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    @Inject
    private Event<PlayerAction> playerActionEvent;

    /**
     *
     * @param gameId
     * @param t
     */
    public void create(Long gameId, Team t) {
        Game g = gameFacade.find(gameId);
        if (gameFacade.findByToken(t.getToken()) != null
                || this.findByToken(t.getToken()) != null) {
            throw new WegasException("This token is already in use.");
        }
        g.addTeam(t);

        this.addRights(g);              // @fixme Should only be done for a player
        em.flush();
        em.refresh(t);
        g.getGameModel().propagateDefaultInstance(false);
    }

    @Override
    public Team update(final Long gameId, Team entity) {
        if ((this.findByToken(entity.getToken()) != null && this.findByToken(entity.getToken()).getId().compareTo(entity.getId()) != 0)
                || gameFacade.findByToken(entity.getToken()) != null) {
            throw new WegasException("This token is already in use.");
        }
        return super.update(gameId, entity);
    }

    private void addRights(Game game) {
        if (!SecurityUtils.getSubject().isPermitted("Game:View:g" + game.getId())) {
            userFacade.getCurrentUser().getMainAccount().addPermission(
                    "Game:View:g" + game.getId(), // Add game view right
                    "GameModel:View:gm" + game.getGameModel().getId());         // and also its associated game model
        }
    }

    /**
     * Search for a team with token
     *
     * @param token
     * @return first team found or null
     */
    public Team findByToken(final String token) {
        final Query findByToken = em.createNamedQuery("findTeamByToken");
        findByToken.setParameter("token", token);
        try {
            return (Team) findByToken.getSingleResult();
        } catch (NoResultException ex) {
            return null;
        }
    }

    @Override
    public void remove(Team entity) {
        List<VariableInstance> instancesToRemove = this.getAssociatedInstances(entity);
        List<Player> players = entity.getPlayers();
        for (Player p : players) {
            instancesToRemove.addAll(playerFacade.getAssociatedInstances(p));
        }
        this.em.remove(entity);
        for (VariableInstance i : instancesToRemove) {
            this.em.remove(i);
        }
    }

    /**
     *
     * @param team
     * @return
     */
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
        this.addRights(p.getGame());
        return p;
    }

    /**
     *
     * @param team
     * @param player
     */
    private void joinTeam(Team team, Player player) {
        team.addPlayer(player);
        em.persist(player);
        //em.flush();
        //em.refresh(player);

        team.getGame().getGameModel().propagateDefaultInstance(false);
        playerActionEvent.fire(new PlayerAction(player));
    }

    public Player joinTeam(Long teamId, Player p) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        this.joinTeam(this.find(teamId), p);
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
