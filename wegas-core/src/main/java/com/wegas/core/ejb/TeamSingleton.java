/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Team;
import javax.ejb.LocalBean;
import javax.ejb.Singleton;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;

/**
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Singleton
@LocalBean
public class TeamSingleton {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
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
     * Nest name definition within a brand new transaction with a lock prevent
     * two team have the same name within the same game
     *
     * @param g the game
     * @param t the team the name to be set
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public void addTeamToGame(Game g, Team t) {
        Game game = em.find(Game.class, g.getId());
        // First, discard initial name id already used
        try {
            findByName(game.getId(), t.getName());
            t.setName(null);
        } catch (WegasNoResultException e) {
            // Gotcha
        }

        int suffix = game.getTeams().size();
        String baseName = game.getShortName();
        // If no name is provided,
        while (t.getName() == null) {
            String name = baseName + "-" + suffix; // Generate one
            try {
                findByName(game.getId(), name);
                suffix++;
            } catch (WegasNoResultException e) {
                t.setName(name);
            }
        }
        game.addTeam(t);
        //em.flush();
        //em.refresh(game);
        //em.refresh(t);
    }
}
