/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Team;

import javax.ejb.LocalBean;
import javax.ejb.Singleton;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;

/**
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Singleton
@LocalBean
public class TeamSingleton {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     * @param gameModelId
     * @param name
     * @return
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Team findByName(Long gameModelId, String name) throws WegasNoResultException {
        final TypedQuery<Team> query = em.createNamedQuery("Team.findByGameIdAndName", Team.class);
        query.setParameter("gameId", gameModelId);
        query.setParameter("name", name);
        try {
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * Persist given team, rename if needed
     *
     * @param team to persist
     * @return persisted team
     */
    public Team persistTeam(Team team) {

        final String baseName =
                team.getName() == null || team.getName().isEmpty()
                        ? team.getGame().getShortName()
                        : team.getName();
        int suffix = 1;
        String name = baseName;
        do {
            try {
                findByName(team.getGame().getId(), name);
                team.setName(null);
                name = baseName + "-" + suffix; // Generate a new name
            } catch (WegasNoResultException e) {
                // this team name is not registered to this game.
                team.setName(name);
            }
        } while (team.getName() == null);
//        game.addTeam(team);
        em.persist(team);
        em.flush(); // register name
        return team;
    }
}
