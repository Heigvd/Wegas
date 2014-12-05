/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.GameAccount;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
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
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

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

        em.flush();
        g.getGameModel().propagateDefaultInstance(false);
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
            this.em.remove(i);
        }
        this.em.remove(entity);
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
