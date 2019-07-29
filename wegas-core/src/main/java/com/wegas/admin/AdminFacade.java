/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.admin;

import com.wegas.admin.persistence.GameAdmin;
import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.event.internal.lifecycle.EntityCreated;
import com.wegas.core.event.internal.lifecycle.PreEntityRemoved;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Game.Status;
import com.wegas.core.persistence.game.GameModel;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class AdminFacade extends BaseFacade<GameAdmin> {

    private final Logger logger = LoggerFactory.getLogger(AdminFacade.class);

    @Inject
    private GameFacade gameFacade;

    public AdminFacade() {
        super(GameAdmin.class);
    }

    public void rebuild() {
        List<Game> findAll = gameFacade.findAll(Game.Status.LIVE);
        findAll.addAll(gameFacade.findAll(Game.Status.BIN));
        findAll.addAll(gameFacade.findAll(Game.Status.DELETE));
        for (Game g : findAll) {
            if (this.findByGame(g.getId()) == null) {
                this.create(new GameAdmin(g));
            }
        }
    }

    public List<GameAdmin> findDone() {
        return findByStatus(GameAdmin.Status.CHARGED, GameAdmin.Status.PROCESSED);
    }

    /**
     * Delete the game which is linked to the given gameAdmin
     *
     * @param gameAdmin the gameAdmin which is linked to the game to destroy
     */
    public void deleteGame(GameAdmin gameAdmin) {
        Game game = gameAdmin.getGame();
        if (game != null) {
            try {
                logger.info("Delete {} game", game);
                /*
                 * Delete the game within a new transaction since it's a common
                 * case to delete several games within the same request.
                 * Isolate each deletion in a dedicated transaction avoid a
                 * TX timeout exception
                 */
                gameFacade.removeTX(game.getId());
            } catch (Exception ex) {
                logger.error("ERROR WHILE DELETING GAME ({}): {}", game, ex);
            }
        }
    }

    public List<GameAdmin> findByStatus(GameAdmin.Status... status) {
        List<GameAdmin> res = new ArrayList<>();
        final TypedQuery<GameAdmin> findByStatus = getEntityManager().createNamedQuery("GameAdmin.findByStatus", GameAdmin.class);
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
     *
     * @return GameAdmin found or null if none was found
     */
    public GameAdmin findByGame(final Long gameId) {
        final TypedQuery<GameAdmin> findByGame = getEntityManager().createNamedQuery("GameAdmin.findByGame", GameAdmin.class);
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

    /**
     * delete games once the bin have been emptied. Note that only games
     * which are marked as {@link Status#PROCESSED} will be destroyed.
     * {@link Status#TODO} and {@link Status#CHARGED} ones will not be destroyed
     * <p>
     * This task is scheduled each Sunday at 1:30 am
     */
    public void deleteGames() {
        final List<GameAdmin> toDelete = this.getGameToDelete();
        logger.info("deleteGames(): {} games to delete", toDelete.size());
        for (GameAdmin ga : toDelete) {
            this.deleteGame(ga);
        }
        // Flush to trigger EntityListener events before loosing RequestManager !
        getEntityManager().flush();
    }

    /**
     * Fetch the list of the games which are to be deleted.
     *
     * @return list of GameAdmin linked to a game which can be destroyed
     */
    public List<GameAdmin> getGameToDelete() {
        TypedQuery<GameAdmin> query = getEntityManager().createNamedQuery("GameAdmin.GamesToDelete", GameAdmin.class);
        return query.getResultList();
    }

    @Override
    public void create(GameAdmin entity) {
        getEntityManager().persist(entity);
    }

    @Override
    public void remove(GameAdmin entity) {
        getEntityManager().remove(entity);
    }
}
