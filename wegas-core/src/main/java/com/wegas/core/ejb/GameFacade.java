/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorFacade;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.event.internal.lifecycle.EntityCreated;
import com.wegas.core.event.internal.lifecycle.PreEntityRemoved;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.game.*;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.naming.NamingException;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import org.slf4j.LoggerFactory;

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

    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     *
     */
    @EJB
    private TeamFacade teamFacade;

    @Inject
    private PlayerFacade playerFacade;

    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    @Inject
    private PopulatorScheduler populatorScheduler;

    @Inject
    private PopulatorFacade populatorFacade;

    @Inject
    private StateMachineFacade stateMachineFacade;

    /**
     *
     */
    public GameFacade() {
        super(Game.class);
    }

    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public boolean isPersisted(final Long gameId) {
        try {
            getEntityManager().createNamedQuery("Game.findIdById").setParameter("gameId", gameId).getSingleResult();
            return true;
        } catch (Exception ex) {
            return false;
        }
    }

    /**
     * Create (persist) a new game base on a gameModel identified by gameModelId.
     * This gameModel will first been duplicated (to freeze it against original gameModel update)
     * Then, the game will be attached to this duplicate.
     * <p>
     * The game will contains a DebugTeam, which contains itself a test player.
     * This team/testPlayer will be immediately usable since theirs variableInstance are create synchronously.
     *
     * @param gameModelId id of the gameModel to create a new game for
     * @param game        the game to persist
     *
     * @throws java.lang.CloneNotSupportedException
     *
     */
    public void publishAndCreate(final Long gameModelId, final Game game) throws CloneNotSupportedException {
        GameModel gm = gameModelFacade.createPlayGameModel(gameModelId);
        this.create(gm, game);

        // Since Permission on gameModel is provided through game induced permission, revoke initial permission on gamemodel:
        userFacade.deletePermissions(userFacade.getCurrentUser(), "GameModel:%:gm" + gm.getId());
    }

    /**
     * {@inheritDoc}
     */
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
     * Persist a new game within the given gameModel
     * <p>
     * The game will contains a DebugTeam, which contains itself a test player.
     * This team/testPlayer will be immediately usable since theirs variableInstance are create synchronously.
     *
     * @param gameModel the gameModel to add the game in
     * @param game      the game to persist within the gameModel
     */
    private void create(final GameModel gameModel, final Game game) {
        requestManager.assertCanInstantiateGameModel(gameModel);

        final User currentUser = userFacade.getCurrentUser();

        if (game.getToken() == null) {
            game.setToken(this.createUniqueToken(game));
        } else if (this.findByToken(game.getToken()) != null) {
            throw WegasErrorMessage.error("This access key is already in use", "COMMONS-SESSIONS-TAKEN-TOKEN-ERROR");
        }
        getEntityManager().persist(game);

        game.setCreatedBy(!(currentUser.getMainAccount() instanceof GuestJpaAccount) ? currentUser : null); // @hack @fixme, guest are not stored in the db so link wont work
        gameModel.addGame(game);

        /*
         * Be sure to grant rights on the game to the trainer before entityManager.flush();
         */
        userFacade.addTrainerToGame(currentUser.getId(), game.getId());

        /*
         * HACK: erk
         */
        gameModel.setCanView(true);
        gameModel.setCanEdit(true);
        gameModel.setCanDuplicate(false);
        gameModel.setCanInstantiate(false);

        gameModelFacade.propagateAndReviveDefaultInstances(gameModel, game, true); // at this step the game is empty (no teams; no players), hence, only Game[Model]Scoped are propagated

        this.addDebugTeam(game);
        stateMachineFacade.runStateMachines(gameModel);

        gameCreatedEvent.fire(new EntityCreated<>(game));
    }

    /**
     * Add a debugteam within the game, unless such a team already exists
     *
     * @param game the game
     *
     * @return true if the debug game has been added, false if it was already here
     */
    public boolean addDebugTeam(Game game) {
        if (!game.hasDebugTeam()) {
            DebugTeam debugTeam = new DebugTeam();
            debugTeam.setGame(game);
            Player testPlayer = debugTeam.getPlayers().get(0);
            testPlayer.setStatus(Status.LIVE);
            testPlayer.setRefName("def");
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
     *
     * @return a unique token based on the game name, suffixed with some random characters
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

    /**
     * {@inheritDoc}
     */
    @Override
    public Game update(final Long entityId, final Game entity) {
        String token = entity.getToken().toLowerCase().replace(" ", "-");
        if (token.length() == 0) {
            throw WegasErrorMessage.error("Access key cannot be empty", "COMMONS-SESSIONS-EMPTY-TOKEN-ERROR");
        }

        Game theGame = this.findByToken(entity.getToken());

        if (theGame != null && !theGame.getId().equals(entity.getId())) {
            throw WegasErrorMessage.error("This access key is already in use", "COMMONS-SESSIONS-TAKEN-TOKEN-ERROR");
        }
        return super.update(entityId, entity);
    }

    /**
     * {@inheritDoc}
     */
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

        userFacade.deletePermissions(entity);
    }

    /**
     * Same as {@link remove(java.lang.Long) } but within a brand new transaction
     *
     * @param gameId id of the game to remove
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public void removeTX(Long gameId) {
        this.remove(gameId);
    }

    /**
     * Search for a game with token
     *
     * @param token
     *
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
     *
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
     *
     * @return all games belonging to the gameModel identified by gameModelId
     *         but DebugGames, ordered by creation time
     */
    public List<Game> findByGameModelId(final Long gameModelId, final String orderBy) {
        return getEntityManager().createQuery("SELECT g FROM Game g "
                + "WHERE TYPE(g) != DebugGame AND g.gameModel.id = :gameModelId ORDER BY g.createdTime DESC", Game.class)
                .setParameter("gameModelId", gameModelId)
                .getResultList();
    }

    /**
     * @param status
     *
     * @return all games which match the given status
     */
    public List<Game> findAll(final Game.Status status) {
        return getEntityManager().createNamedQuery("Game.findByStatus", Game.class).setParameter("status", status).getResultList();
    }

    /**
     * Filter out the debug team
     *
     * @param game
     *
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

    /**
     * Get all games with the given status which are accessible to the current user
     *
     * @param status {@link Game.Status#LIVE} {@link Game.Status#BIN} {@link Game.Status#DELETE}
     *
     * @return the list of all games which given status the current use has access to
     */
    public Collection<Game> findByStatusAndUser(Game.Status status) {
        ArrayList<Game> games = new ArrayList<>();
        Map<Long, List<String>> gMatrix = new HashMap<>();
        Map<Long, List<String>> gmMatrix = new HashMap<>();

        // Previous behaviour was to fetch all games from DB and then filter against user permissions
        // it was time consuming
        // New way is to fetch permissions first and extract games from this list
        String roleQuery = "SELECT p FROM Permission p WHERE "
                + "(p.role.id in "
                + "    (SELECT r.id FROM User u JOIN u.roles r WHERE u.id = :userId)"
                + ")";

        String userQuery = "SELECT p FROM Permission p WHERE p.user.id = :userId";

        gameModelFacade.processQuery(userQuery, gmMatrix, gMatrix, GameModel.GmType.PLAY, GameModel.Status.LIVE, status);
        gameModelFacade.processQuery(roleQuery, gmMatrix, gMatrix, GameModel.GmType.PLAY, GameModel.Status.LIVE, status);

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
                        dgm.setCanView(Boolean.TRUE);
                        dgm.setCanEdit(Boolean.TRUE);
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
     * Create a new player within a team for the user identified by userId
     *
     * @param teamId
     * @param userId
     * @param languages
     *
     * @return a new player, linked to user, who just joined the team
     */
    public Player joinTeam(Long teamId, Long userId, List<Locale> languages) {
        return this.joinTeam(teamId, userId, null, languages);
    }

    /**
     * Create a new player within a team for the user identified by userId
     *
     * @param teamId     id of the team to join
     * @param userId     id of the user to create a player for, may be null to create an anonymous player
     * @param playerName common name of the player
     * @param languages
     *
     * @return a new player, linked to a user, who just joined the team
     */
    public Player joinTeam(Long teamId, Long userId, String playerName, List<Locale> languages) {
        Long playerId = playerFacade.joinTeamAndCommit(teamId, userId, playerName, languages);
        Player player = playerFacade.find(playerId);
        populatorScheduler.scheduleCreation();
        playerFacade.detach(player);
        player = playerFacade.find(player.getId());
        int indexOf = populatorFacade.getQueue().indexOf(player);
        player.setQueueSize(indexOf + 1);
        return player;
    }

    /**
     * Same as {@link #joinTeam(java.lang.Long, java.lang.Long, java.lang.String)} but anonymously.
     * (for testing purpose)
     *
     * @param teamId     id of the team to join
     * @param playerName common name of the player
     *
     * @return a new player anonymous player who just joined the team
     */
    public Player joinTeam(Long teamId, String playerName, List<Locale> languages) {
        Long id = requestManager.getCurrentUser().getId();
        logger.info("Adding user {} to team {}", id, teamId);
        return this.joinTeam(teamId, id, playerName, languages);
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
        gameModelFacade.propagateAndReviveDefaultInstances(game.getGameModel(), game, false);
        stateMachineFacade.runStateMachines(game);
    }

    /**
     * Reset a game
     *
     * @param gameId id of the game to reset
     */
    public void reset(Long gameId) {
        this.reset(this.find(gameId));
    }

    /**
     * Allow to access this facade event when there is no active CDI context.
     * <b>Please avoid that</b>
     *
     * @return GameFacade instance
     */
    public static GameFacade lookup() {
        try {
            return Helper.lookupBy(GameFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving game facade", ex);
            return null;
        }
    }

    /**
     * Since the team create is done in two step, we have to ensure the team is
     * scheduled
     *
     * @param gameId
     * @param t
     *
     *
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public Long createAndCommit(Long gameId, Team t) {
        Game g = this.find(gameId);

        AbstractAccount currentAccount = userFacade.getCurrentAccount();
        // current user is logged as guest and guest are not allowed
        if (currentAccount != null && !g.getGameModel().getProperties().getGuestAllowed() && currentAccount instanceof GuestJpaAccount) {
            throw WegasErrorMessage.error("Access denied : guest not allowed");
        }

        g.addTeam(t);
        g = this.find(gameId);
        t.setCreatedBy(userFacade.getCurrentUser());
        //this.addRights(userFacade.getCurrentUser(), g);  // @fixme Should only be done for a player, but is done here since it will be needed in later requests to add a player
        getEntityManager().persist(t);

        return t.getId();
    }
}
