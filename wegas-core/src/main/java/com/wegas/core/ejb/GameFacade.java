/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.event.internal.ResetEvent;
import com.wegas.core.event.internal.lifecycle.EntityCreated;
import com.wegas.core.event.internal.lifecycle.PreEntityRemoved;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.*;
import com.wegas.core.persistence.game.Game.Status;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.naming.NamingException;
import javax.persistence.NoResultException;
import javax.persistence.Query;
import javax.persistence.TypedQuery;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@LocalBean
public class GameFacade extends BaseFacade<Game> {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(GameFacade.class);

    /**
     * Fired once game created
     */
    @Inject
    private Event<EntityCreated<Game>> gameCreatedEvent;

    /**
     * Fired pre Game removed
     */
    @Inject
    private Event<PreEntityRemoved<Game>> gameRemovedEvent;

    @EJB
    private RequestFacade requestFacade;

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

    @Inject
    private RequestManager requestManager;

    /**
     *
     */
    @Inject
    private Event<ResetEvent> resetEvent;

    /**
     *
     */
    public GameFacade() {
        super(Game.class);
    }

    /**
     * @param gameModelId
     * @param game
     * @throws IOException
     */
    public void publishAndCreate(final Long gameModelId, final Game game) throws IOException {
        GameModel gm = gameModelFacade.duplicate(gameModelId);
        gm.setName(gameModelFacade.find(gameModelId).getName());// @HACK Set name back to the original
        gm.setComments(""); // Clear comments
        gm.setStatus(GameModel.Status.PLAY);
        this.create(gm, game);
    }

    @Override
    public void create(final Game game) {
        this.create(game.getGameModel().getId(), game);
    }

    /**
     * @param gameModelId
     * @param game
     */
    public void create(final Long gameModelId, final Game game) {
        this.create(gameModelFacade.find(gameModelId), game);
    }

    /**
     * @param gameModel
     * @param game
     */
    private void create(final GameModel gameModel, final Game game) {
        final User currentUser = userFacade.getCurrentUser();

        if (game.getToken() == null) {
            game.setToken(this.createUniqueToken(game));
        } else if (this.findByToken(game.getToken()) != null) {
            throw WegasErrorMessage.error("This token is already in use.");
        }
        getEntityManager().persist(game);
        gameModel.propagateDefaultInstance(game, true);

        game.setCreatedBy(!(currentUser.getMainAccount() instanceof GuestJpaAccount) ? currentUser : null); // @hack @fixme, guest are not stored in the db so link wont work
        gameModel.addGame(game);
        this.addDebugTeam(game);

        //gameModelFacade.reset(gameModel);                                       // Reset the game so the default player will have instances
        userFacade.addUserPermission(currentUser,
                "Game:View,Edit:g" + game.getId());                             // Grant permission to creator
        userFacade.addUserPermission(currentUser,
                "Game:View:g" + game.getId());                                  // Grant play to creator

        try {                                                                   // By default games can be join w/ token
            roleFacade.findByName("Public").addPermission("Game:Token:g" + game.getId());
        } catch (WegasNoResultException ex) {
            logger.error("Unable to find Role: Public");
        }
        gameCreatedEvent.fire(new EntityCreated<>(game));
    }

    /**
     * Add a debugteam within the game, unless such a team already exists
     *
     * @param game the game
     * @return
     */
    public boolean addDebugTeam(Game game) {
        if (!game.hasDebugTeam()) {
            DebugTeam debugTeam = new DebugTeam();
            debugTeam.setGame(game);
            teamFacade.create(debugTeam);
            //Player get = debugTeam.getPlayers().get(0);
            //requestFacade.commit(get, false);
            //game.addTeam(new DebugTeam());
            return true;
        } else {
            return false;
        }
    }

    /**
     * @param game
     * @return
     */
    public String createUniqueToken(Game game) {
        //String prefixKey = game.getShortName().toLowerCase().replace(" ", "-");
        String prefixKey = Helper.replaceSpecialCharacters(game.getShortName().toLowerCase().replace(" ", "-"));
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
            String genLetter = Helper.genRandomLetters(length);
            key = prefixKey + "-" + genLetter;

            Game foundGameByToken = this.findByToken(key);
            if (foundGameByToken == null) {
                foundUniqueKey = true;
            }
            counter += 1;
        }
        return key;
    }

    @Override
    public Game update(final Long entityId, final Game entity) {
        String token = entity.getToken().toLowerCase().replace(" ", "-");
        if (token.length() == 0) {
            throw WegasErrorMessage.error("Access key cannot be empty");
        }

        Game theGame = this.findByToken(entity.getToken());

        if (theGame != null && !theGame.getId().equals(entity.getId())) {
            throw WegasErrorMessage.error("This access key is already in use");
        }
        return super.update(entityId, entity);
    }

    @Override
    public void remove(final Game entity) {
        gameRemovedEvent.fire(new PreEntityRemoved<>(entity));

        // This is for retrocompatibility w/ game models that do not habe DebugGame
        if (entity.getGameModel().getGames().size() <= 1
                && !(entity.getGameModel().getGames().get(0) instanceof DebugGame)) {// This is for retrocompatibility w/ game models that do not habe DebugGame
            gameModelFacade.remove(entity.getGameModel());
        } else {
            getEntityManager().remove(entity);
            entity.getGameModel().getGames().remove(entity);
        }

        //for (Team t : entity.getTeams()) {
        //    teamFacade.remove(t);
        //}
        userFacade.deleteUserPermissionByInstance("g" + entity.getId());
        userFacade.deleteRolePermissionsByInstance("g" + entity.getId());
    }

    /**
     * Search for a game with token
     *
     * @param token
     * @return first game found or null
     */
    public Game findByToken(final String token) {
        final TypedQuery<Game> tq = getEntityManager().createNamedQuery("Game.findByToken", Game.class).setParameter("token", token).setParameter("status", Game.Status.LIVE);
        try {
            return tq.getSingleResult();
        } catch (NoResultException ex) {
            return null;
        }
    }

    /**
     * @param search
     * @return all game matching the search token
     */
    public List<Game> findByName(final String search) {
        final TypedQuery<Game> query = getEntityManager().createNamedQuery("Game.findByNameLike", Game.class);
        query.setParameter("name", search);
        return query.getResultList();
    }

    /**
     * @param gameModelId
     * @param orderBy     not used...
     * @return all games belonging to the gameModel identified by gameModelId
     *         but DebugGames, ordered by creation time
     */
    public List<Game> findByGameModelId(final Long gameModelId, final String orderBy) {
        return getEntityManager().createQuery("SELECT game FROM Game game "
                + "WHERE TYPE(game) != DebugGame AND game.gameModel.id = :gameModelId ORDER BY game.createdTime DESC", Game.class)
                .setParameter("gameModelId", gameModelId)
                .getResultList();
    }

    /**
     * @param status
     * @return all games which match the given status
     */
    public List<Game> findAll(final Game.Status status) {
        return getEntityManager().createNamedQuery("Game.findByStatus", Game.class).setParameter("status", status).getResultList();
    }

    /**
     * @param userId
     * @return all non deleted games the given user plays in
     */
    public List<Game> findRegisteredGames(final Long userId) {
        final Query getByGameId = getEntityManager().createQuery("SELECT game, p FROM Game game "
                + "LEFT JOIN game.teams t LEFT JOIN  t.players p "
                + "WHERE t.game.id = game.id AND p.team.id = t.id "
                + "AND p.user.id = :userId AND "
                + "(game.status = com.wegas.core.persistence.game.Game.Status.LIVE OR game.status = com.wegas.core.persistence.game.Game.Status.BIN) "
                + "ORDER BY p.joinTime ASC", Game.class)
                .setParameter("userId", userId);

        return this.findRegisterdGames(getByGameId);
    }

    /**
     * @param userId
     * @param gameModelId
     * @return all LIVE games of the given GameModel the given user plays in
     */
    public List<Game> findRegisteredGames(final Long userId, final Long gameModelId) {
        final Query getByGameId = getEntityManager().createQuery("SELECT game, p FROM Game game "
                + "LEFT JOIN game.teams t LEFT JOIN  t.players p "
                + "WHERE t.game.id = game.id AND p.team.id = t.id AND p.user.id = :userId AND game.gameModel.id = :gameModelId "
                + "AND game.status = com.wegas.core.persistence.game.Game.Status.LIVE "
                + "ORDER BY p.joinTime ASC", Game.class)
                .setParameter("userId", userId)
                .setParameter("gameModelId", gameModelId);

        return this.findRegisterdGames(getByGameId);
    }

    /**
     * @param q
     * @return Game query result plus createdTime hack
     */
    private List<Game> findRegisterdGames(final Query q) {
        final List<Game> games = new ArrayList<>();
        for (Object ret : q.getResultList()) {                                // @hack Replace created time by player joined time
            final Object[] r = (Object[]) ret;
            final Game game = (Game) r[0];
            this.getEntityManager().detach(game);
            game.setCreatedTime(((Player) r[1]).getJoinTime());
            games.add(game);
        }
        return games;
    }

    /**
     * @param roleName
     * @return all game the give role has access to
     */
    public Collection<Game> findPublicGamesByRole(String roleName) {
        Collection<Game> games = new ArrayList<>();
        try {
            Role role;
            role = roleFacade.findByName(roleName);
            for (Permission permission : role.getPermissions()) {
                if (permission.getValue().startsWith("Game:View")) {
                    Long gameId = Long.parseLong(permission.getValue().split(":g")[1]);
                    Game game = this.find(gameId);
                    if (game.getStatus() == Game.Status.LIVE) {
                        games.add(game);
                    }
                }
            }
        } catch (WegasNoResultException ex) {
            logger.error("FindPublicGamesByRole: " + roleName + " role not found");
        }
        return games;
    }

    /**
     * Filter out the debug team
     *
     * @param game
     * @return the game without the debug team
     */
    public Game getGameWithoutDebugTeam(Game game) {
        if (game != null) {
            this.detach(game);
            List<Team> withoutDebugTeam = new ArrayList<>();
            for (Team teamToCheck : game.getTeams()) {
                if (!(teamToCheck instanceof DebugTeam)) {
                    withoutDebugTeam.add(teamToCheck);
                }
            }
            game.setTeams(withoutDebugTeam);
        }
        return game;
    }

    public Collection<Game> findByStatusAndUser(Game.Status status) {
        ArrayList<Game> games = new ArrayList<>();
        Map<Long, List<String>> gMatrix = new HashMap<>();
        Map<Long, List<String>> gmMatrix = new HashMap<>();

        String roleQuery = "SELECT p FROM Permission p WHERE "
                + "(p.role.id in "
                + "    (SELECT r.id FROM User u JOIN u.roles r WHERE u.id = :userId)"
                + ")";

        String userQuery = "SELECT p FROM Permission p WHERE p.user.id = :userId";

        gameModelFacade.processQuery(userQuery, gmMatrix, gMatrix, GameModel.Status.PLAY, status);
        gameModelFacade.processQuery(roleQuery, gmMatrix, gMatrix, GameModel.Status.PLAY, status);

        for (Map.Entry<Long, List<String>> entry : gMatrix.entrySet()) {
            Long id = entry.getKey();
            Game g = this.find(id);
            if (g != null && g.getStatus() == status) {
                List<String> perm = entry.getValue();
                if (perm.contains("Edit") || perm.contains("*")) {
                    Game dg = this.getGameWithoutDebugTeam(g);
                    GameModel dgm = dg.getGameModel();
                    List<String> gmPerm = gmMatrix.get(dgm.getId());
                    if (gmPerm != null) {
                        dgm.setCanView(gmPerm.contains("View") || gmPerm.contains("*"));
                        dgm.setCanEdit(gmPerm.contains("Edit") || gmPerm.contains("*"));
                        dgm.setCanDuplicate(gmPerm.contains("Duplicate") || gmPerm.contains("*"));
                        dgm.setCanInstantiate(gmPerm.contains("Instantiate") || gmPerm.contains("*"));
                    } else {
                        dgm.setCanView(Boolean.FALSE);
                        dgm.setCanEdit(Boolean.FALSE);
                        dgm.setCanDuplicate(Boolean.FALSE);
                        dgm.setCanInstantiate(Boolean.FALSE);
                    }
                    games.add(dg);
                }
            }
        }

        return games;
    }

    /**
     * @param team
     * @param player
     */
    public void joinTeam(Team team, Player player) {
        team.addPlayer(player);
        this.getEntityManager().persist(player);
        team.getGame().getGameModel().propagateDefaultInstance(player, true);
        this.getEntityManager().flush();
        requestFacade.firePlayerAction(player, true);
    }

    /**
     * @param teamId
     * @param p
     * @return the player who just joined the team
     */
    public Player joinTeam(Long teamId, Player p) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        this.joinTeam(teamFacade.find(teamId), p);
        return p;
    }

    /**
     * @param team
     * @param user
     * @return a new player, linked to user, who just joined the team
     */
    public Player joinTeam(Team team, User user) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        Player p = new Player();
        user.getPlayers().add(p);
        p.setUser(user);
        p.setName(user.getName());
        this.addRights(user, team.getGame());
        this.joinTeam(team, p);
        return p;
    }

    /**
     * @param teamId
     * @param userId
     * @return a new player, linked to user, who just joined the team
     */
    public Player joinTeam(Long teamId, Long userId) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        return this.joinTeam(teamFacade.find(teamId), userFacade.find(userId));
    }

    /**
     * @param user
     * @param game
     */
    public void addRights(User user, Game game) {
        user.addPermission(
                "Game:View:g" + game.getId(), // Add "View" right on game,
                "GameModel:View:gm" + game.getGameModel().getId());             // and also "View" right on its associated game model
    }

    public void recoverRights(Game game) {
        for (Team team : game.getTeams()) {
            for (Player player : team.getPlayers()) {
                User user = player.getUser();
                if (user != null) {
                    this.addRights(user, game);
                }
            }
        }
    }

    /**
     * Bin given game, changing it's status to {@link Status#BIN}
     *
     * @param entity Game
     */
    public void bin(Game entity) {
        entity.setStatus(Game.Status.BIN);
    }

    /**
     * Set game status, changing to {@link Status#LIVE}
     *
     * @param entity Game
     */
    public void live(Game entity) {
        entity.setStatus(Game.Status.LIVE);
    }

    /**
     * Set game status, changing to {@link Status#DELETE}
     *
     * @param entity GameModel
     */
    public void delete(Game entity) {
        entity.setStatus(Game.Status.DELETE);
    }

    /**
     * Reset a game
     *
     * @param game the game to reset
     */
    public void reset(final Game game) {
        // Need to flush so prepersit events will be thrown (for example Game will add default teams)
        //getEntityManager().flush();
        game.getGameModel().propagateDefaultInstance(game, false);
        //getEntityManager().flush(); // DA FU    ()
        // Send an reset event (for the state machine and other)
        resetEvent.fire(new ResetEvent(game));
    }

    /**
     * Reset a game
     *
     * @param gameId id of the game to reset
     */
    public void reset(Long gameId) {
        this.reset(this.find(gameId));
    }

    public static GameFacade lookup() {
        try {
            return Helper.lookupBy(GameFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving game facade", ex);
            return null;
        }
    }
}
