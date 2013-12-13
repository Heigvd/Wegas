/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.PersistenceException;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.*;
import static com.wegas.core.persistence.game.GameAccess.ENROLMENTKEY;
import static com.wegas.core.persistence.game.GameAccess.OPEN;
import static com.wegas.core.persistence.game.GameAccess.SINGLEUSAGEENROLMENTKEY;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.User;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class GameFacade extends AbstractFacadeImpl<Game> {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(GameFacade.class);
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelEntityFacade;
    /**
     *
     */
    @EJB
    private RoleFacade roleFacade;
    /**
     *
     */
    @EJB
    private TeamFacade teamFacade;
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
     */
    public GameFacade() {
        super(Game.class);
    }

    /**
     *
     * @param gameModelId
     * @param game
     */
    public void create(final Long gameModelId, final Game game) {

        if (this.findByToken(game.getToken()) != null
                || teamFacade.findByToken(game.getToken()) != null) {
            throw new WegasException("This token is already in use.");
        }

        final User currentUser = userFacade.getCurrentUser();
        game.setCreatedBy(!(currentUser.getMainAccount() instanceof GuestJpaAccount) ? currentUser : null); // @hack @fixme, guest are not stored in the db so link wont work

        GameModel gameModel = gameModelEntityFacade.find(gameModelId);
        gameModel.addGame(game);
        em.flush();                                                             // To retrieve game id

        userFacade.addAccountPermission(currentUser.getMainAccount(),
                "Game:View,Edit:g" + game.getId());                             // Grant permission to creator
        userFacade.addAccountPermission(currentUser.getMainAccount(),
                "Game:View:g" + game.getId());                                  // Grant play to creator

        try {                                                                   // By default games can be join w/ token
            roleFacade.findByName("Public").addPermission("Game:Token:g" + game.getId());
        } catch (PersistenceException ex) {
            logger.error("Unable to find Role: Public", ex);
        }
    }

    @Override
    public Game update(final Long entityId, final Game entity) {
        if ((this.findByToken(entity.getToken()) != null
                && this.findByToken(entity.getToken()).getId().compareTo(entity.getId()) != 0)
                || teamFacade.findByToken(entity.getToken()) != null) {
            throw new WegasException("This token is already in use.");
        }
        return super.update(entityId, entity);
    }

    @Override
    public void remove(final Game entity) {
        for (Team t : entity.getTeams()) {
            teamFacade.remove(t);
        }
        super.remove(entity);

        userFacade.deleteAccountPermissionByInstance("g" + entity.getId());
        userFacade.deleteRolePermissionsByInstance("g" + entity.getId());
    }

    public void checkKey(final Game game, final String key) throws Exception {
        switch (game.getAccess()) {
            case CLOSE:
                throw new Exception("This game does not accept new players.");    // There user is already registered to target game

            case OPEN:
                break;

            case ENROLMENTKEY:
                if (!game.setKey().equals(key)) {
                    throw new Exception("The provided key does not match.");    // There user is already registered to target game
                }
                break;
            case SINGLEUSAGEENROLMENTKEY:
                for (GameEnrolmentKey eKey : game.getKeys()) {
                    if (eKey.getKey().equals(key)) {
                        break;
                    }
                }
                throw new Exception("The provided key does not match.");    // There user is already registered to target game
        }
    }

    /**
     * Search for a game with token
     *
     * @param token
     * @return first game found or null
     */
    public Game findByToken(final String token) {
        final CriteriaBuilder cb = em.getCriteriaBuilder();
        final CriteriaQuery cq = cb.createQuery();
        final Root<Game> game = cq.from(Game.class);
        cq.where(cb.equal(game.get(Game_.token), token));
        Query q = em.createQuery(cq);
        try {
            return (Game) q.getSingleResult();
        } catch (NoResultException ex) {
            return null;
        }
    }

    public List<Game> findByGameModelId(final Long gameModelId, final String orderBy) {
        final Query getByGameId =
                em.createQuery("SELECT game FROM Game game "
                + "WHERE game.gameModel.id = :gameModelId ORDER BY game.createdTime DESC");

        GameModel gm = new GameModel();
        gm.getGames();
        getByGameId.setParameter("gameModelId", gameModelId);
        //getByGameId.setParameter("orderBy", orderBy);
        return getByGameId.getResultList();
    }

    /**
     *
     * @return
     */
    public List<Game> findAll(final String orderBy) {
        final Query getByGameId = em.createQuery("SELECT game FROM Game game ORDER BY game.createdTime ASC");
        //getByGameId.setParameter("orderBy", orderBy);
        return getByGameId.getResultList();
    }

    public List<Game> findRegisteredGames(final Long userId) {
        final Query getByGameId =
                em.createQuery("SELECT game, p FROM Game game "
                + "LEFT JOIN game.teams t LEFT JOIN  t.players p "
                + "WHERE t.gameId = game.id AND p.teamId = t.id "
                + "AND p.user.id = :userId "
                + "ORDER BY p.joinTime ASC");
        getByGameId.setParameter("userId", userId);

        return this.findRegisterdGames(getByGameId);
    }

    public List<Game> findRegisteredGames(final Long userId, final Long gameModelId) {
        final Query getByGameId =
                em.createQuery("SELECT game, p FROM Game game "
                + "LEFT JOIN game.teams t LEFT JOIN  t.players p "
                + "WHERE t.gameId = game.id AND p.teamId = t.id AND p.user.id = :userId AND game.gameModel.id = :gameModelId "
                + "ORDER BY p.joinTime ASC");
        getByGameId.setParameter("userId", userId);
        getByGameId.setParameter("gameModelId", gameModelId);

        return this.findRegisterdGames(getByGameId);
    }

    private List<Game> findRegisterdGames(final Query q) {
        final List<Game> games = new ArrayList<>();
        for (Object ret : q.getResultList()) {                                // @hack Replace created time by player joined time
            final Object[] r = (Object[]) ret;
            final Game game = (Game) r[0];
            this.em.detach(game);
            game.setCreatedTime(((Player) r[1]).getJoinTime());
            games.add(game);
        }
        return games;
    }

    /**
     *
     * @return
     */
    @Override
    public EntityManager getEntityManager() {
        return em;
    }
}
