/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.internal.PlayerAction;
import com.wegas.core.exception.PersistenceException;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.*;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
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
public class GameFacade extends BaseFacade<Game> {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(GameFacade.class);
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;
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
    @Inject
    private Event<PlayerAction> playerActionEvent;

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
     * @throws IOException
     */
    public void publishAndCreate(final Long gameModelId, final Game game) throws IOException {
        GameModel gm = gameModelFacade.duplicate(gameModelId);
        gm.setName(gameModelFacade.find(gameModelId).getName());// @HACK Set name back to the original
        gm.setTemplate(false);
        this.create(gm, game);
    }

    @Override
    public void create(final Game game) {
        this.create(game.getGameModel().getId(), game);
    }

    /**
     *
     * @param gameModelId
     * @param game
     */
    public void create(final Long gameModelId, final Game game) {
        this.create(gameModelFacade.find(gameModelId), game);
    }

    /**
     *
     * @param gameModel
     * @param game
     */
    public void create(final GameModel gameModel, final Game game) {
        if (game.getToken() == null) {
            game.setToken(this.createUniqueEnrolmentkey(game));
        } else if (this.findByToken(game.getToken()) != null) {
            throw new WegasException("This token is already in use.");
        }

        final User currentUser = userFacade.getCurrentUser();
        game.setCreatedBy(!(currentUser.getMainAccount() instanceof GuestJpaAccount) ? currentUser : null); // @hack @fixme, guest are not stored in the db so link wont work
        gameModel.addGame(game);
        gameModelFacade.reset(gameModel);                                       // Reset the game so the default player will have instances

        userFacade.addAccountPermission(currentUser.getMainAccount(),
                "Game:View,Edit:g" + game.getId());                             // Grant permission to creator
        userFacade.addAccountPermission(currentUser.getMainAccount(),
                "Game:View:g" + game.getId());                                  // Grant play to creator

        try {                                                                   // By default games can be join w/ token
            roleFacade.findByName("Public").addPermission("Game:Token:g" + game.getId());
        } catch (PersistenceException ex) {
            logger.error("Unable to find Role: Public");
        }
    }

    /**
     *
     * @param game
     * @return
     */
    public String createUniqueEnrolmentkey(Game game) {
        String prefixKey = game.getShortName().toLowerCase().replace(" ", "-");
        boolean foundUniqueKey = false;
        int counter = 0;
        String key = null;

        int length = 2;
        int maxRequest = 400;
        while (!foundUniqueKey) {
            if (counter > maxRequest) {
                length += 1;
                maxRequest += 400;
            }
            String genLetter = this.genRandomLetter(length);
            key = prefixKey + "-" + genLetter;
            boolean foundedGameAccountKey = true;
            boolean foundedGameEnrolentKey = true;
            try {
                this.findGameAccountKey(key);
            } catch (Exception e) {
                foundedGameAccountKey = false;
            }
            try {
                this.findGameEnrolmentKey(key);
            } catch (Exception e) {
                foundedGameEnrolentKey = false;
            }
            Game foundGameByToken = this.findByToken(key);
            if (!foundedGameEnrolentKey && !foundedGameAccountKey && foundGameByToken == null) {
                foundUniqueKey = true;
            }
            counter += 1;
        }
        return key;
    }

    private String genRandomLetter(long length) {
        final String tokenElements = "abcdefghijklmnopqrstuvwxyz";
        final Integer digits = tokenElements.length();
        length = Math.min(50, length); // max 50 length;
        StringBuilder sb = new StringBuilder();
        Integer random = (int) (Math.random() * digits);
        sb.append(tokenElements.charAt(random));
        if (length > 1) {
            sb.append(genRandomLetter(length - 1));
        }
        return sb.toString();
    }

    @Override
    public Game update(final Long entityId, final Game entity) {
        String token = entity.getToken().toLowerCase().replace(" ", "-");
        if (token.length() == 0) {
            throw new WegasException("Key cannot be empty");
        }
        String[] splitedToken = entity.getToken().split("-");
        if (!token.endsWith("-")) {
            try {
                Long.parseLong(splitedToken[splitedToken.length - 1]);
                throw new WegasException("You can't have a trait followed by a number (example: xx-12)");
            } catch (NumberFormatException e) {
                //Gotcha
            }
        }

        if ((this.findByToken(entity.getToken()) != null
                && !this.findByToken(entity.getToken()).getId().equals(entity.getId()))) {
            //|| teamFacade.findByToken(entity.getToken()) != null) {
            throw new WegasException("This token is already in use.");
        }
        return super.update(entityId, entity);
    }

    @Override
    public void remove(final Game entity) {
        if (entity.getGameModel().getGames().size() <= 1
                && !(entity.getGameModel().getGames().get(0) instanceof DebugGame)) {// This is for retrocompatibility w/ game models that do not habe DebugGame
            gameModelFacade.remove(entity.getGameModel());
        }
        for (Team t : entity.getTeams()) {
            teamFacade.remove(t);
        }
        super.remove(entity);

        userFacade.deleteAccountPermissionByInstance("g" + entity.getId());
        userFacade.deleteRolePermissionsByInstance("g" + entity.getId());
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

    /**
     *
     * @param key
     * @return
     */
    public GameEnrolmentKey findGameEnrolmentKey(final String key) {
        final CriteriaBuilder cb = em.getCriteriaBuilder();
        final CriteriaQuery cq = cb.createQuery();
        final Root<GameEnrolmentKey> game = cq.from(GameEnrolmentKey.class);
        cq.where(cb.equal(game.get(GameEnrolmentKey_.key), key));
        Query q = em.createQuery(cq);
        return (GameEnrolmentKey) q.getSingleResult();
    }

    /**
     *
     * @param key
     * @return
     */
    public GameAccountKey findGameAccountKey(String key) {
        final CriteriaBuilder cb = em.getCriteriaBuilder();
        final CriteriaQuery cq = cb.createQuery();
        final Root<GameAccountKey> gameAccount = cq.from(GameAccountKey.class);
        cq.where(cb.equal(gameAccount.get(GameAccountKey_.key), key));
        Query q = em.createQuery(cq);
        return (GameAccountKey) q.getSingleResult();
    }

    /**
     *
     * @param search
     * @return
     */
    public List<Game> findByName(String search) {
        final CriteriaBuilder cb = em.getCriteriaBuilder();
        final CriteriaQuery cq = cb.createQuery();
        final Root<Game> game = cq.from(Game.class);
        cq.where(cb.like(game.get(Game_.name), search));
        Query q = em.createQuery(cq);
        return (List<Game>) q.getResultList();
    }

    /**
     *
     * @param gameModelId
     * @param orderBy
     * @return
     */
    public List<Game> findByGameModelId(final Long gameModelId, final String orderBy) {
        return em.createQuery("SELECT game FROM Game game "
                + "WHERE TYPE(game) != DebugGame AND game.gameModel.id = :gameModelId ORDER BY game.createdTime DESC")
                .setParameter("gameModelId", gameModelId)
                .getResultList();
    }

    /**
     *
     * @param orderBy
     * @return
     */
    public List<Game> findAll(final String orderBy) {
        return em.createQuery("SELECT game FROM Game game WHERE TYPE(game) != DebugGame ORDER BY game.createdTime ASC")
                .getResultList();
    }

    /**
     *
     * @param userId
     * @return
     */
    public List<Game> findRegisteredGames(final Long userId) {
        final Query getByGameId = em.createQuery("SELECT game, p FROM Game game "
                + "LEFT JOIN game.teams t LEFT JOIN  t.players p "
                + "WHERE t.gameId = game.id AND p.teamId = t.id "
                + "AND p.user.id = :userId "
                + "ORDER BY p.joinTime ASC")
                .setParameter("userId", userId);

        return this.findRegisterdGames(getByGameId);
    }

    /**
     *
     * @param userId
     * @param gameModelId
     * @return
     */
    public List<Game> findRegisteredGames(final Long userId, final Long gameModelId) {
        final Query getByGameId = em.createQuery("SELECT game, p FROM Game game "
                + "LEFT JOIN game.teams t LEFT JOIN  t.players p "
                + "WHERE t.gameId = game.id AND p.teamId = t.id AND p.user.id = :userId AND game.gameModel.id = :gameModelId "
                + "ORDER BY p.joinTime ASC")
                .setParameter("userId", userId)
                .setParameter("gameModelId", gameModelId);

        return this.findRegisterdGames(getByGameId);
    }

    /**
     *
     * @param q
     * @return
     */
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
     * @param roleName
     * @return
     */
    public Collection<Game> findPublicGamesByRole(String roleName) {
        Role role = roleFacade.findByName(roleName);
        Collection<Game> games = new ArrayList<>();
        for (Permission permission : role.getPermissions()) {
            if (permission.getValue().startsWith("Game:View")) {
                Long gameId = Long.parseLong(permission.getValue().split(":g")[1]);
                games.add(this.find(gameId));
            }
        }
        return games;
    }

    /**
     *
     * @param g
     * @param accountNumber
     * @return
     */
    public Game createGameAccount(Game g, Long accountNumber) {
        for (int i = 0; i < accountNumber; i++) {
            int newNumber = g.getAccountkeys().size() + 1;
            GameAccountKey gameAccountKey = new GameAccountKey();
            gameAccountKey.setKey(g.getToken() + "-" + newNumber);
            gameAccountKey.setGame(g);
            g.getAccountkeys().add(gameAccountKey);
        }
        return g;
    }

    /**
     *
     * @param team
     * @param player
     */
    public void joinTeam(Team team, Player player) {
        team.addPlayer(player);
        em.persist(player);

        team.getGame().getGameModel().propagateDefaultInstance(false);
        playerActionEvent.fire(new PlayerAction(player));
    }

    /**
     *
     * @param teamId
     * @param p
     * @return
     */
    public Player joinTeam(Long teamId, Player p) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        this.joinTeam(teamFacade.find(teamId), p);
        return p;
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
        this.addRights(user, p.getGame());
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
        return this.joinTeam(teamFacade.find(teamId), userFacade.find(userId));
    }

    /**
     *
     * @param user
     * @param game
     */
    public void addRights(User user, Game game) {
        user.getMainAccount().addPermission(
                "Game:View:g" + game.getId(), // Add "View" right on game,
                "GameModel:View:gm" + game.getGameModel().getId());             // and also "View" right on its associated game model
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
