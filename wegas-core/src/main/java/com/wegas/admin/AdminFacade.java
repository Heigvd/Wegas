/*
 * Wegas
 * http://wegas.albasim.ch
  
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.admin;

import com.wegas.admin.persistence.GameAdmin;
import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.event.internal.lifecycle.EntityCreated;
import com.wegas.core.event.internal.lifecycle.PreEntityRemoved;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;
import java.util.ArrayList;
import java.util.List;

/**
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Stateless
@LocalBean
public class AdminFacade extends BaseFacade<GameAdmin> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    @EJB
    private GameFacade gameFacade;

    public AdminFacade() {
        super(GameAdmin.class);
    }

    @Override
    public EntityManager getEntityManager() {
        return this.em;
    }

    public void rebuild() {
        List<Game> findAll = gameFacade.findAll(Game.Status.LIVE);
        findAll.addAll(gameFacade.findAll(Game.Status.BIN));
        findAll.addAll(gameFacade.findAll(Game.Status.DELETE));
        for (Game g : findAll) {
            try {
                this.findByGame(g.getId());
            } catch (NoResultException ex) {
                this.create(new GameAdmin(g));
            }
        }
    }

    public List<GameAdmin> findDone() {
        return findByStatus(GameAdmin.Status.CHARGED, GameAdmin.Status.PROCESSED);
    }

    public void deleteGame(GameAdmin gameAdmin) {
        Game game = gameAdmin.getGame();
        if (game != null) {
            gameFacade.remove(game);
        }
    }

    public List<GameAdmin> findByStatus(GameAdmin.Status... status) {
        List<GameAdmin> res = new ArrayList<>();
        final TypedQuery<GameAdmin> findByStatus = em.createNamedQuery("GameAdmin.findByStatus", GameAdmin.class);
        for (GameAdmin.Status s : status) {
            findByStatus.setParameter("status", s);
            res.addAll(findByStatus.getResultList());
        }
        return res;
    }

    /**
     * Get a gameAdmin by Game's id
     *
     * @param gameId game's id
     * @return GameAdmin found or null if none was found
     */
    public GameAdmin findByGame(final Long gameId) {
        final TypedQuery<GameAdmin> findByGame = em.createNamedQuery("GameAdmin.findByGame", GameAdmin.class);
        findByGame.setParameter("gameId", gameId);
        try {
            return findByGame.getSingleResult();
        } catch (NoResultException ex) {
            return null;
        }
    }

    /**
     * Hook after game is created
     *
     * @param ev event
     */
    public void onGameCreated(@Observes EntityCreated<Game> ev) {
        if (ev.getEntity().getClass() == Game.class) {
            Game game = gameFacade.find(ev.getEntity().getId());
            if (game != null) {
                this.create(new GameAdmin(game));
            }
        }
    }

    /**
     * Hook after gameModel is created
     *
     * @param ev event
     */
    public void onGameModelCreated(@Observes EntityCreated<GameModel> ev) {
        final GameModel gameModel = ev.getEntity();
        for (Game g : gameModel.getGames()) {
            this.onGameCreated(new EntityCreated<>(g));
        }
    }

    /**
     * Hook before game is destroyed
     *
     * @param ev event
     */
    public void preGameDestroyed(@Observes PreEntityRemoved<Game> ev) {
        if (ev.getEntity().getClass() == Game.class) {
            GameAdmin game = this.findByGame(ev.getEntity().getId());
            if (game != null) {
                game.populate();
                game.setGame(null);
            }
        }
    }

    /**
     * Hook before gameModel is destroyed
     *
     * @param ev event
     */
    public void preGameModelDestroyed(@Observes PreEntityRemoved<GameModel> ev) {
        final GameModel gameModel = ev.getEntity();
        for (Game g : gameModel.getGames()) {
            this.preGameDestroyed(new PreEntityRemoved<>(g));
        }
    }

}
