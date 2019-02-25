/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.ejb.I18nFacade;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Locale;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.inject.Inject;
import javax.persistence.NoResultException;
import javax.persistence.Query;
import javax.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class PlayerFacade extends BaseFacade<Player> {

    private static final Logger logger = LoggerFactory.getLogger(PlayerFacade.class);

    /**
     *
     */
    @EJB
    private GameFacade gameFacade;

    @EJB
    private TeamFacade teamFacade;

    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    @Inject
    private I18nFacade i18nFacade;

    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    @Inject
    private StateMachineFacade stateMachineFacade;

    @Inject
    private RequestManager requestManager;

    @Inject
    private WebsocketFacade websocketFacade;

    /**
     * Create a player linked to the user identified by userId(may be null) and join the team
     * identified by teamId.
     * <p>
     * This method run within a new transaction, meaning the returned player has
     * already been persisted and committed to database. Since it way done with its own
     * entity manager, only the id of the new player is return to force caller to
     * fetch it from its own entity manager;
     * <p>
     * This new player is not usable since its variablesInstances are create asynchronously.
     * Caller should call {@link PopulatorScheduler#scheduleCreation()} to make sure
     * its variables will be created in the near future
     *
     * @param teamId     id of the team to join
     * @param userId     id the user to create a player for, may be null
     * @param playerName common name for the new player
     * @param languages
     *
     * @return brand new player id
     */
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public Long joinTeamAndCommit(Long teamId, Long userId, String playerName, List<Locale> languages) {
        // logger.log(Level.INFO, "Adding user " + userId + " to team: " + teamId + ".");
        logger.info("Adding user {} to team {}", userId, teamId);

        Team team = teamFacade.find(teamId);

        AbstractAccount currentAccount = userFacade.getCurrentAccount();
        // current user is logged as guest and guest are not allowed
        if (currentAccount != null && !team.getGame().getGameModel().getProperties().getGuestAllowed() && currentAccount instanceof GuestJpaAccount) {
            throw WegasErrorMessage.error("Access denied : guest not allowed");
        }

        Player player = new Player();
        GameModel gameModel = team.getGame().getGameModel();
        List<GameModelLanguage> gmLanguages = gameModel.getLanguages();

        String preferredLang = null;
        if (languages != null && gmLanguages != null) {
            for (Locale locale : languages) {
                GameModelLanguage lang = gameModel.getLanguageByCode(locale.toLanguageTag());
                if (lang != null && lang.isActive()) {
                    preferredLang = lang.getCode();
                    break;
                } else {
                    lang = gameModel.getLanguageByCode(locale.getLanguage());
                    if (lang != null && lang.isActive()) {
                        preferredLang = lang.getCode();
                        break;
                    }
                }
            }
        }

        if (Helper.isNullOrEmpty(preferredLang)) {
            if (gmLanguages != null && !gmLanguages.isEmpty()) {
                preferredLang = gmLanguages.get(0).getCode();
            } else {
                throw new WegasErrorMessage("error", "No language");
            }
        }
        player.setLang(preferredLang);

        if (userId != null) {
            User user = userFacade.find(userId);
            user.getPlayers().add(player);
            player.setUser(user);
            player.setName(user.getName());
        } else {
            if (playerName != null) {
                player.setName(playerName);
            } else {
                player.setName("Some anonymous user");
            }
        }

        team.addPlayer(player);
        this.getEntityManager().persist(player);

        return player.getId();
    }

    /**
     * Look for a user player within game
     *
     * @param gameId game id
     * @param userId user id
     *
     * @return the player owned by user linked to the game
     *
     * @throws WegasNoResultException if not player was found
     */
    public Player findByGameIdAndUserId(final Long gameId, final Long userId) throws WegasNoResultException {
        Player p = this.findPlayer(gameId, userId);
        if (p != null) {
            return p;
        } else {
            throw new WegasNoResultException("No player found");
        }
    }

    /**
     * Return the list of player which haven't their variableinstances ready
     *
     * @return list of player which are queued for populating (not yet usable)
     */
    public List<Player> findPlayersToPopulate() {
        TypedQuery<Player> query = this.getEntityManager().createNamedQuery("Player.findToPopulate", Player.class);
        return query.getResultList();
    }

    /**
     * Fetch the player owned by a user within a game or null if none exists.
     *
     * @param gameId id of the game
     * @param userId id of the player
     *
     * @return
     */
    public Player findPlayer(final Long gameId, final Long userId) {
        try {
            final TypedQuery<Player> findByGameIdAndUserId = getEntityManager().createNamedQuery("Player.findPlayerByGameIdAndUserId", Player.class);
            findByGameIdAndUserId.setParameter("gameId", gameId);
            findByGameIdAndUserId.setParameter("userId", userId);
            return findByGameIdAndUserId.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    /**
     * @param gameId
     * @param userId
     *
     * @return
     */
    public boolean isInGame(final Long gameId, final Long userId) {
        return this.findPlayer(gameId, userId) != null;
    }

    /**
     * Fetch the player owned by a user within a team or null if none exists.
     *
     * @param teamId id of the team
     * @param userId id of the user
     *
     * @return the player owned by user who is member of the team or null
     */
    public Player findPlayerInTeam(final Long teamId, final Long userId) {
        try {
            final TypedQuery<Player> findByGameIdAndUserId = getEntityManager().createNamedQuery("Player.findPlayerByTeamIdAndUserId", Player.class);
            findByGameIdAndUserId.setParameter("teamId", teamId);
            findByGameIdAndUserId.setParameter("userId", userId);
            return findByGameIdAndUserId.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    public boolean isInTeam(final Long teamId, final Long userId) {
        return this.findPlayerInTeam(teamId, userId) != null;
    }

    public Player findPlayerInGameModel(final Long gameModelId, final Long userId) {
        try {
            final TypedQuery<Player> findByGameIdAndUserId = getEntityManager().createNamedQuery("Player.findPlayerByGameModelIdAndUserId", Player.class);
            findByGameIdAndUserId.setParameter("gameModelId", gameModelId);
            findByGameIdAndUserId.setParameter("userId", userId);
            return findByGameIdAndUserId.getSingleResult();
        } catch (NoResultException e) {
            return null;
        }
    }

    public boolean isInGameModel(final Long gameModelId, final Long userId) {
        return this.findPlayerInGameModel(gameModelId, userId) != null;
    }

    /**
     * Get all PlayerScoped variableinstances a player has access to.
     * Including:
     * <ul>
     * <li> its own PlayerScoped instances</li>
     * <li> PlayedScoped instances owned by any of its team partner if the instance broadcast scope is set to TeamScope</li>
     * <li> PlayedScoped instances owned by any player is the game if the instance broadcast scope is set to GameScope</li>
     * </ul>
     *
     * @param player the player to fetch instances for
     *
     * @return all PlayerScoped instances the player has access to
     */
    private List<VariableInstance> getPlayerInstances(Player player) {
        List<VariableInstance> result = new ArrayList<>();

        TypedQuery<VariableInstance> query = getEntityManager().createNamedQuery(
                "VariableInstance.findPlayerInstance", VariableInstance.class);

        for (VariableInstance instance : player.getPrivateInstances()) {
            PlayerScope scope = instance.getPlayerScope();
            query.setParameter("scopeId", scope.getId());
            if (scope.getBroadcastScope().equals(PlayerScope.class.getSimpleName())) {
                // Only owners has access to their variable
                result.add(instance);
            } else if (scope.getBroadcastScope().equals("GameScope")) {
                // Current player has access to all instances in the game
                for (Player p : player.getGame().getLivePlayers()) {
                    query.setParameter("playerId", p.getId());
                    VariableInstance vi = query.getSingleResult();
                    result.add(vi);
                }
            } else if (scope.getBroadcastScope().equals(TeamScope.class.getSimpleName())) {
                //Player has access to all instances within their game
                for (Player p : player.getTeam().getLivePlayers()) {
                    query.setParameter("playerId", p.getId());
                    VariableInstance vi = query.getSingleResult();
                    result.add(vi);
                }
            }
        }
        return result;
    }

    /**
     * Get all TeamScoped variableinstances a team has access to.
     * Including:
     * <ul>
     * <li> the team own TeamScoped instances</li>
     * <li> other TeamScoped instances owned by any other team is the game if the instance broadcast scope is set to GameScope</li>
     * </ul>
     *
     * @param team the team to fetch instances for
     *
     * @return all TeamScoped instances the team has access to
     */
    private List<VariableInstance> getTeamInstances(Team team) {
        List<VariableInstance> result = new ArrayList<>();

        TypedQuery<VariableInstance> query = getEntityManager().createNamedQuery(
                "VariableInstance.findTeamInstance", VariableInstance.class);

        for (VariableInstance instance : team.getPrivateInstances()) {
            TeamScope scope = instance.getTeamScope();
            query.setParameter("scopeId", scope.getId());
            if (scope.getBroadcastScope().equals("GameScope")) {
                //current player has access to all instance in the game
                for (Team t : team.getGame().getTeams()) {
                    if (t.getStatus().equals(Status.LIVE)) {
                        // LIVE ONLY
                        query.setParameter("teamId", t.getId());
                        VariableInstance vi = query.getSingleResult();
                        result.add(vi);
                    }
                }
            } else {
                //TeamScope and PlayerScope -> only current team instance !
                result.add(instance);

            }
        }
        return result;
    }

    /**
     * Get all GameModelScoped variableinstances a gameModel owns
     * Including:
     * <ul>
     * <li> the gameModel own GameModelScoped instances</li>
     * </ul>
     *
     * @param gameModel the gameModel to fetch instances for
     *
     * @return all instances owned by the gameModel
     */
    private List<VariableInstance> getGameModelInstances(GameModel gameModel) {
        return gameModel.getPrivateInstances();
    }

    /**
     * Get all instances a player as access to, including those from others owners
     * with a less specific broadcast scope
     *
     * @param playerId the player to get instances for
     *
     * @return List of instances
     */
    public List<VariableInstance> getInstances(final Long playerId) {
        Player player = this.find(playerId);
        Team team = player.getTeam();
        Game game = team.getGame();
        GameModel gameModel = game.getGameModel();

        List<VariableInstance> instances = this.getPlayerInstances(player);
        instances.addAll(this.getTeamInstances(team));
        instances.addAll(this.getGameModelInstances(gameModel));

        return instances;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void create(Player entity) {
        getEntityManager().persist(entity);
        getEntityManager().find(Team.class, entity.getTeam().getId()).addPlayer(entity);
        if (entity.getUser() != null) {
            getEntityManager().find(User.class, entity.getUser().getId()).getPlayers().add(entity);
        }
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void remove(final Player player) {
        //List<VariableInstance> instances = this.getAssociatedInstances(player);
        Team team = teamFacade.find(player.getTeam().getId());

        if (team instanceof DebugTeam == false) {
            if (team.getPlayers().size() == 1) {
                // Last player -> remove the whole team
                teamFacade.remove(team);
            } else {
                // Only remove the player
                team.getPlayers().remove(player);
                if (player.getUser() != null) {
                    player.getUser().getPlayers().remove(player);
                }
                this.getEntityManager().remove(player);
            }
        }
    }

    /**
     * Get all players in the game identified by gameId
     *
     * @param gameId id of the game
     *
     * @return all players in the game
     */
    public List<Player> getByGameId(Long gameId) {
        List<Player> players = new ArrayList<>();
        Game game = gameFacade.find(gameId);
        for (Team t : game.getTeams()) {
            players.addAll(t.getPlayers());
        }
        return players;
        /*TypedQuery<Player> findByGameId = getEntityManager().createNamedQuery("Player.findPlayerByGameId", Player.class);
        findByGameId.setParameter("gameId", gameId);
        return findByGameId.getResultList();*/
    }

    /**
     * Returns the first available player in the target game.
     *
     * @param gameId
     *
     * @return a player from the game
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Player findByGameId(Long gameId) throws WegasNoResultException {
        Game game = gameFacade.find(gameId);
        for (Team t : game.getTeams()) {
            if (t.getPlayers().size() > 0) {
                return t.getPlayers().get(0);
            }
        }
        throw new WegasNoResultException("No player");
    }

    /**
     * Returns the first available player in the target gameModel.
     * A player of any DebugTeam or any player from any team of a DebugGame
     *
     *
     * @param gameModelId
     *
     * @return a player from the gameModel
     *
     */
    public Player findDebugPlayerByGameModelId(Long gameModelId) {
        GameModel gameModel = gameModelFacade.find(gameModelId);
        for (Game game : gameModel.getGames()) {
            Player p = findDebugPlayerByGame(game);
            if (p != null) {
                return p;
            }
        }
        return null;
    }

    /**
     * The first test player found.
     * A player of any DebugTeam or any player from any team of a DebugGame
     *
     * @param game
     *
     * @return
     *
     * @throws WegasNoResultException
     */
    private Player findDebugPlayerByGame(Game game) {
        for (Team t : game.getTeams()) {
            if (t instanceof DebugTeam || game instanceof DebugGame) {
                if (t.getPlayers().size() > 0) {
                    return t.getPlayers().get(0);
                }
            }
        }
        return null;
    }

    /**
     * Returns the first available test player in the target game.
     *
     * @param gameId
     *
     * @return a player from the game
     *
     */
    public Player findDebugPlayerByGameId(Long gameId) {
        return this.findDebugPlayerByGame(gameFacade.find(gameId));
    }

    /**
     * Get all player in the gameModel identified by gameModelId
     *
     * @param gameModelId id of the gameModel
     *
     * @return all players from all teams and all games from gameModel
     */
    public List<Player> getByGameModelId(Long gameModelId) {
        List<Player> players = new ArrayList<>();
        GameModel gm = gameModelFacade.find(gameModelId);
        for (Game g : gm.getGames()) {
            for (Team t : g.getTeams()) {
                players.addAll(t.getPlayers());
            }
        }
        return players;
    }

    /**
     * Returns the first available player in the target game model.
     *
     * @param gameModelId
     *
     * @return any player in the game model
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Player findByGameModelId(Long gameModelId) throws WegasNoResultException {
        Query getByGameId = getEntityManager().createQuery("SELECT p FROM Player p WHERE p.team.gameTeams.game.gameModel.id = :gameModelId");
        getByGameId.setParameter("gameModelId", gameModelId);
        try {
            return (Player) getByGameId.setMaxResults(1).getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * Find a player for a live game
     *
     * @param id player's id
     *
     * @return Player if found and game is live or null
     */
    public Player findLive(Long id) {
        Player player = this.find(id);
        if (player == null || !player.getGame().getStatus().equals(Game.Status.LIVE)) {
            return null;
        }
        return player;
    }

    /**
     * Find a player test player
     *
     * @param id player's id
     *
     * @return Player if found and game is a debug one, null otherwise
     */
    public Player findTestPlayer(Long id) {
        Player player = this.find(id);
        if (player == null || !(player.getGame() instanceof DebugGame)) {
            return null;
        }
        return player;
    }

    /**
     * Find a player within the given game owned by the currentUser
     *
     * @param g the game to find the player in
     *
     * @return player owned by the currentUser for the given game
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public Player findCurrentPlayer(Game g) throws WegasNoResultException {
        return this.findByGameIdAndUserId(g.getId(), userFacade.getCurrentUser().getId());
    }

    /**
     * Dummy constructor
     */
    public PlayerFacade() {
        super(Player.class);
    }

    public Player retry(Long playerId) {
        Player p = this.find(playerId);
        if (p.getStatus() == Status.FAILED) {
            gameModelFacade.createAndRevivePrivateInstance(p.getGame().getGameModel(), p);
            p.setStatus(Status.LIVE);

            this.flush();
            stateMachineFacade.runStateMachines(p);
            websocketFacade.propagateNewPlayer(p);
        }
        return p;
    }

    /**
     * Reset a player
     *
     * @param player the player to reset
     */
    public void reset(final Player player) {
        gameModelFacade.propagateAndReviveDefaultInstances(player.getGameModel(), player, false); // reset only this player instances
        stateMachineFacade.runStateMachines(player);
    }

    /**
     * Reset a player
     *
     * @param playerId id of the player to reset
     */
    public void reset(Long playerId) {
        this.reset(this.find(playerId));
    }

    /**
     * Get all locks linked to audiences a player is part of
     *
     * @param playerId id of the player to retrieve locks for
     *
     * @return list of locked token the given player have to take into account
     */
    public Collection<String> getLocks(Long playerId) {
        Player player = this.find(playerId);
        Team team = player.getTeam();
        Game game = player.getGame();
        GameModel gameModel = game.getGameModel();

        List<String> audiences = new ArrayList<>();
        audiences.add(player.getChannel());
        audiences.add(team.getChannel());
        audiences.add(game.getChannel());
        audiences.add(gameModel.getChannel());

        return requestManager.getTokensByAudiences(audiences);
    }
}
