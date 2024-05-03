/**
 * Wegas
 * http://wegas.albasim.ch
 * <p>
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.Helper.EmailAttributes;
import com.wegas.core.XlsxSpreadsheet;
import com.wegas.core.async.PopulatorFacade;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.statemachine.StateMachineFacade;
import com.wegas.core.event.internal.lifecycle.EntityCreated;
import com.wegas.core.event.internal.lifecycle.PreEntityRemoved;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.rest.util.pagination.Page;
import com.wegas.core.rest.util.pagination.Pageable;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.persistence.token.SurveyToken;
import com.wegas.core.security.util.ScriptExecutionContext;
import com.wegas.survey.persistence.SurveyDescriptor;

import java.util.*;
import java.util.stream.Collectors;

import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;
import jakarta.ejb.TransactionAttribute;
import jakarta.ejb.TransactionAttributeType;
import jakarta.enterprise.event.Event;
import jakarta.inject.Inject;

import javax.naming.NamingException;

import jakarta.persistence.NoResultException;
import jakarta.persistence.TypedQuery;
import jakarta.persistence.criteria.*;
import jakarta.servlet.http.HttpServletRequest;
import org.openjdk.nashorn.api.scripting.ScriptObjectMirror;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.util.CellRangeAddress;
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
    @Inject
    private GameModelFacade gameModelFacade;

    /**
     *
     */
    @Inject
    private TeamFacade teamFacade;

    @Inject
    private PlayerFacade playerFacade;

    /**
     *
     */
    @Inject
    private UserFacade userFacade;

    @Inject
    private AccountFacade accountFacade;

    @Inject
    private PopulatorScheduler populatorScheduler;

    @Inject
    private PopulatorFacade populatorFacade;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    @Inject
    private StateMachineFacade stateMachineFacade;

    @Inject
    private ScriptFacade scriptFacade;

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
     * Create (persist) a new game base on a gameModel identified by gameModelId. This gameModel
     * will first been duplicated (to freeze it against original gameModel update) Then, the game
     * will be attached to this duplicate.
     * <p>
     * The game will contains a DebugTeam, which contains itself a test player. This team/testPlayer
     * will be immediately usable since theirs variableInstance are create synchronously.
     *
     * @param gameModelId id of the gameModel to create a new game for
     * @param game        the game to persist
     * @throws java.lang.CloneNotSupportedException
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
     * The game will contains a DebugTeam, which contains itself a test player. This team/testPlayer
     * will be immediately usable since theirs variableInstance are create synchronously.
     *
     * @param gameModel the gameModel to add the game in
     * @param game      the game to persist within the gameModel
     */
    private void create(final GameModel gameModel, final Game game) {
        requestManager.assertCanInstantiateGameModel(gameModel);

        final User currentUser = userFacade.getCurrentUser();

        if (Helper.isNullOrEmpty(game.getToken())) {
            game.setToken(this.createUniqueToken(game));
        } else if (this.findLiveOrBinByToken(game.getToken()) != null) {
            throw WegasErrorMessage.error("This access key is already in use",
                    "COMMONS-SESSIONS-TAKEN-TOKEN-ERROR");
        }
        getEntityManager().persist(game);

        // @hack @fixme, guest are not stored in the db so link wont work
        // well, I don't think a guest can create games...
        game.setCreatedBy(!(currentUser.getMainAccount() instanceof GuestJpaAccount) ? currentUser : null);
        gameModel.addGame(game);

        /*
         * Be sure to grant rights on the game to the trainer before entityManager.flush();
         */
        userFacade.addTrainerToGame(currentUser.getId(), game.getId());

        gameModelFacade.propagateAndReviveDefaultInstances(gameModel, game, true); // at this step the game is empty (no teams; no players), hence, only Game[Model]Scoped are propagated

        this.addDebugTeam(game);
        stateMachineFacade.runStateMachines(game, true);

        gameCreatedEvent.fire(new EntityCreated<>(game));
    }

    /**
     * Add a debugteam within the game, unless such a team already exists
     *
     * @param game the game
     * @return true if the debug game has been added, false if it was already here
     */
    public boolean addDebugTeam(Game game) {
        if (!game.hasDebugTeam()) {
            DebugTeam debugTeam = new DebugTeam();
            debugTeam.setGame(game);
            Player testPlayer = debugTeam.getPlayers().get(0);
            testPlayer.setStatus(Status.LIVE);

            List<GameModelLanguage> languages = game.getGameModel().getLanguages();
            if (languages != null && !languages.isEmpty()) {
                testPlayer.setLang(languages.get(0).getCode());
            }

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

            Game foundGameByToken = this.findLiveOrBinByToken(key);
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

        Game theGame = this.findLiveOrBinByToken(entity.getToken());

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
     * Search for a LIVE game with token
     *
     * @param token
     * @return first game found or null
     */
    public Game findByToken(final String token) {
        return findByStatusAndToken(token, Game.Status.LIVE);
    }

    public Game findLiveOrBinByToken(final String token) {
        Game game = findByStatusAndToken(token, Game.Status.LIVE);
        if (game == null) {
            game = findByStatusAndToken(token, Game.Status.BIN);
        }
        return game;
    }

    public Game findByStatusAndToken(final String token, Game.Status status) {
        final TypedQuery<Game> tq = getEntityManager()
                .createNamedQuery("Game.findByToken", Game.class)
                .setParameter("token", token)
                .setParameter("status", status);
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
     * @return all games belonging to the gameModel identified by gameModelId but DebugGames,
     * ordered by creation time
     */
    public List<Game> findByGameModelId(final Long gameModelId, final String orderBy) {
        return getEntityManager().createQuery("SELECT g FROM Game g "
                        + "WHERE TYPE(g) != DebugGame AND g.gameModel.id = :gameModelId ORDER BY g.createdTime DESC", Game.class)
                .setParameter("gameModelId", gameModelId)
                .getResultList();
    }

    /**
     * @param status
     * @return all games which match the given status
     */
    public List<Game> findAll(final Game.Status status) {
        return getEntityManager().createNamedQuery("Game.findByStatus", Game.class)
                .setParameter("status", status).getResultList();
    }

//    /**
//     * Find all games with given ids and status (was used for faster findByStatusAndUser fetch)
//     *
//     * @param ids    ids of games to fetch
//     * @param status status of games to fetch
//     * @return all games which match given ids and status
//     */
//    public List<Game> findByIdsAndStatus(final List<Long> ids, final Game.Status status) {
//        final CriteriaBuilder criteriaBuilder = getEntityManager().getCriteriaBuilder();
//        final CriteriaQuery<Game> query = criteriaBuilder.createQuery(Game.class);
//        Root<Game> gameRoot = query.from(Game.class);
//
//        query.where(
//                criteriaBuilder.and(
//                        gameRoot.get("id").in(ids),
//                        criteriaBuilder.equal(gameRoot.get("status"), status)
//                )
//        );
//
//        TypedQuery<Game> typedQuery = getEntityManager().createQuery(query);
//
//        return typedQuery.getResultList();
//    }

    /**
     * Get all paginated games with the given status which are accessible to the current user
     *
     * @param status   status {@link Game.Status#LIVE} {@link Game.Status#BIN} {@link Game.Status#DELETE}
     * @param pageable
     * @return all games paginated
     */
    public Page<Game> findByStatusAndUserPaginated(Game.Status status, Pageable pageable) {

        List<Game.Status> gStatuses = new ArrayList<>();
        gStatuses.add(status);

        Map<Long, List<String>> gMatrix = this.getPermissionMatrix(gStatuses);
        Map<Long, List<String>> filteredGMatrix = gMatrix.entrySet().stream()
                .filter(l -> l.getValue().contains("Edit") || l.getValue().contains("*"))
                .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue));

        final CriteriaBuilder criteriaBuilder = getEntityManager().getCriteriaBuilder();
        final CriteriaQuery<Game> query = criteriaBuilder.createQuery(Game.class);
        Root<Game> gameRoot = query.from(Game.class);
        query.select(gameRoot);

        Predicate whereClause = criteriaBuilder.and(
                criteriaBuilder.equal(gameRoot.get("status"), status),
                gameRoot.get("id").in(new ArrayList<>(filteredGMatrix.keySet()))
        );

        for (String param : pageable.getSplitQuery()) {
            ParameterExpression<String> queryParameter = criteriaBuilder.parameter(String.class);
            if (!param.isEmpty()) {
               Join<Game, GameModel> gameModelJoin = gameRoot.join("gameModel", JoinType.INNER);
                whereClause = criteriaBuilder.and(whereClause, criteriaBuilder.or(
                        criteriaBuilder.like(criteriaBuilder.lower(gameRoot.get("name")), "%" + param.toLowerCase() + "%"),
                        criteriaBuilder.like(criteriaBuilder.lower(gameModelJoin.get("name")), "%" + param.toLowerCase() + "%")
                ));
            }
        }

        query.where(whereClause);

        int total = getEntityManager().createQuery(query).getResultList().size();
        TypedQuery<Game> listQuery = pageable.paginateQuery(getEntityManager().createQuery(query));

        return new Page<Game>(total, pageable.getPage(), pageable.getSize(), listQuery.getResultList());
    }

    /**
     * Find all game by status.
     *
     * @param statuses statuses to search
     * @return all games which match any of the given status
     */
    public List<Game> findAll(final List<Game.Status> statuses) {
        return getEntityManager().createNamedQuery("Game.findByStatuses", Game.class)
                .setParameter("statuses", statuses).getResultList();
    }


    /**
     * Find all id of games with given logId
     *
     * @return list of id
     */
    public List<Long> getAllGameIdByLogId(String logId) {
        TypedQuery<Long> query = this.getEntityManager()
                .createNamedQuery("Game.findAllIdByLogId", Long.class);
        query.setParameter("logId", logId);
        return query.getResultList();
    }

    /**
     * Get all games with the given status which are accessible to the current user
     *
     * @param status {@link Game.Status#LIVE} {@link Game.Status#BIN} {@link Game.Status#DELETE}
     * @return the list of all games which given status the current use has access to
     */
    public Collection<Game> findByStatusAndUser(Game.Status status) {
        List<Game.Status> gStatuses = new ArrayList<>();
        gStatuses.add(status);

        Map<Long, List<String>> gMatrix = this.getPermissionMatrix(gStatuses);

        ArrayList<Game> games = new ArrayList<>();

        for (Map.Entry<Long, List<String>> entry : gMatrix.entrySet()) {
            Long id = entry.getKey();
            Game g = this.find(id);
            if (g != null && g.getStatus() == status) {
                List<String> perm = entry.getValue();
                if (perm.contains("Edit") || perm.contains("*")) {
                    games.add(g);
                }
            }
        }

        return games;
    }

    /**
     * Fetch all game ids that current user has access to which match any of the given statuses.
     *
     * @param statuses statuses of game to look for
     * @return list of gameId mapped to the permission the user has
     */
    public Map<Long, List<String>> getPermissionMatrix(List<Game.Status> statuses) {
        Map<Long, List<String>> gMatrix = new HashMap<>();

        // Previous behaviour was to fetch all games from DB and then filter against user permissions
        // it was time consuming
        // New way is to fetch permissions first and extract games from this list
        String roleQuery = "SELECT p FROM Permission p WHERE "
                + "(p.role.id in "
                + "    (SELECT r.id FROM User u JOIN u.roles r WHERE u.id = :userId)"
                + ")";

        String userQuery = "SELECT p FROM Permission p WHERE p.user.id = :userId";

        gameModelFacade.processQuery(userQuery, null, gMatrix, null, null, statuses);
        gameModelFacade.processQuery(roleQuery, null, gMatrix, null, null, statuses);

        return gMatrix;
    }

    /**
     * Join the game individually. It means creating a brand new team, named after user's name, and
     * joining that very team. The game does not need to be in freeForAll mode to use this method.
     *
     * @param game      the game to join
     * @param languages list of user preferred languages
     * @return the brand new player
     */
    public Player joinIndividually(Game game, List<Locale> languages) {
        User currentUser = userFacade.getCurrentUser();

        Team team = new Team(teamFacade.findUniqueNameForTeam(game, currentUser.getName()), 1);
        teamFacade.create(game.getId(), team); // return managed team
        team = teamFacade.find(team.getId());
        Player p = this.joinTeam(team.getId(), currentUser.getId(), languages);
        this.getEntityManager().refresh(team);
        return p;
    }

    /**
     * Join the game to participate in surveys. It means creating a brand new team, named after
     * user's name, and joining that very team. The game does not need to be in freeForAll mode to
     * use this method. A survey player will only have a subset of the variable initialised
     *
     * @param game      the game to join
     * @param languages list of user preferred languages
     * @return the brand new player
     */
    public Player joinForSurvey(Game game, List<Locale> languages) {
        User currentUser = userFacade.getCurrentUser();

        Team team = new Team(teamFacade.findUniqueNameForTeam(game, currentUser.getName()), 1);
        team.setGame(game);

        team.setStatus(Status.SURVEY);

        Player player = new Player();
        player.setStatus(Status.SURVEY);
        player.setUser(currentUser);

        GameModelLanguage lang = playerFacade.findPreferredLanguages(game.getGameModel(), languages);

        player.setLang(lang.getCode());

        team.addPlayer(player);

        teamFacade.createForSurvey(team);

        return player;
    }

    /**
     * Return all accounts with valid email address linked to LIVE players of the given game.
     *
     * @param game
     * @return
     */
    private List<AbstractAccount> getPlayerAccountsWithEmail(Game game) {
        return game.getLivePlayers().stream()
                .map(p -> p.getUser())
                .filter(u -> u != null)
                .map(u -> u.getMainAccount())
                .filter(account -> account != null && !Helper.isNullOrEmpty(account.getEmail()))
                .collect(Collectors.toList());
    }

    /**
     * Get the one game from a list of surveys.
     *
     * @param surveys
     * @return the game
     * @throws WegasErrorMessage surveys belong to different games or no game found
     */
    public Game getGameFromSurveys(List<SurveyDescriptor> surveys) {
        GameModel gm = SurveyToken.getUniqueGameModel(surveys);

        if (gm != null) {
            if (!gm.getGames().isEmpty()) {
                return gm.getGames().get(0);
            } else {
                throw WegasErrorMessage.error("No game in the gameModel");
            }
        } else {
            throw WegasErrorMessage.error("Surveys belong to different gamemodels");
        }
    }

    /**
     * Send invitation to participate in a survey. An invitation will be sent to all LIVE players
     * which have a valid email address. Invitation will force users to log-in with their very own
     * account.
     * <p>
     * Such survey is made of several SurveyDescriptor. All SurveyDescriptor must belong to the same
     * gameModel.
     *
     * @param surveys surveys
     * @param request need request to generate the link
     * @param email   structure with attributes recipients (ignored here), sender, subject and body.
     * @return list of emails to which an invitation has been sent
     * @throws WegasErrorMessage if 1) surveys belong to different GameModels; 2) no game; 3) no
     *                           account
     */
    public List<String> sendSurveysInvitation(List<SurveyDescriptor> surveys,
                                              EmailAttributes email,
                                              HttpServletRequest request) {
        Game game = getGameFromSurveys(surveys);
        List<AbstractAccount> accounts = getPlayerAccountsWithEmail(game);
        List<String> invitedEmails = new ArrayList<>();
        if (!accounts.isEmpty()) {
            for (AbstractAccount account : accounts) {
                String currEmail = account.getEmail();
                email.setRecipient(currEmail);
                invitedEmails.add(currEmail);
                accountFacade.sendSurveyToken(account, email, surveys, request);
            }
            return invitedEmails;
        } else {
            throw WegasErrorMessage.error("Unable to find accounts with email addresses", "WEGAS-INVITE-SURVEY-NO-EMAIL");
        }
    }

    private List<SurveyDescriptor> loadSurveys(String ids) {
        return Arrays.stream(ids.split(","))
                .map(sId -> (SurveyDescriptor) variableDescriptorFacade.find(Long.parseLong(sId.trim())))
                .collect(Collectors.toList());
    }

    public List<String> sendSurveysInvitationToPlayers(HttpServletRequest request,
                                                       String surveyIds, EmailAttributes email) {

        List<SurveyDescriptor> surveys = this.loadSurveys(surveyIds);

        return this.sendSurveysInvitation(surveys, email, request);
    }

    public List<String> sendSurveysInvitationAnonymouslyToPlayers(HttpServletRequest request,
                                                                  String surveyIds, EmailAttributes email) {

        List<SurveyDescriptor> surveys = this.loadSurveys(surveyIds);

        return this.sendSurveysInvitationAnonymouslyToPlayers(surveys, email, request);
    }

    /**
     * Send invitation to participate in a survey. An invitation will be sent to all LIVE players
     * which have a valid email address. Invitation will force users to log-in with brand new
     * anonymous guest accounts.
     * <p>
     * Such survey is made of several SurveyDescriptor. All SurveyDescriptor must belong to the same
     * gameModel. must belongs to the same game model.
     *
     * @param surveys surveys
     * @param email   structure with attributes recipients (ignored here), sender, subject and body.
     * @param request need request to generate the link
     * @return list of emails to which an invitation has been sent
     * @throws WegasErrorMessage if 1) surveys belong to different GameModel; 2) no game; 3) no
     *                           account
     */
    public List<String> sendSurveysInvitationAnonymouslyToPlayers(List<SurveyDescriptor> surveys,
                                                                  EmailAttributes email,
                                                                  HttpServletRequest request
    ) {
        Game game = getGameFromSurveys(surveys);
        List<AbstractAccount> accounts = getPlayerAccountsWithEmail(game);
        List<String> recipients = new ArrayList<>();
        if (!accounts.isEmpty()) {
            for (AbstractAccount account : accounts) {
                recipients.add(account.getEmail());
            }
            email.setRecipients(recipients);
            accountFacade.sendSurveyAnonymousTokens(email, surveys, request);
        } else {
            throw WegasErrorMessage.error("Unable to find accounts with email addresses", "WEGAS-INVITE-SURVEY-NO-EMAIL");
        }
        return recipients;
    }

    public void sendSurveysInvitationAnonymouslyToList(HttpServletRequest request,
                                                       String surveyIds,
                                                       EmailAttributes email) {

        List<SurveyDescriptor> surveys = this.loadSurveys(surveyIds);

        this.sendSurveysInvitationAnonymouslyToList(surveys, email, request);
    }

    /**
     * Send invitation to participate in a survey. One invitation will be sent to each recipient
     * address. Such survey is made of several SurveyDescriptor. Every SurveyDescriptor must belong
     * to the same gameModel.
     *
     * @param surveys surveys
     * @param email   structure with attributes recipients, sender, subject and body.
     * @param request need request to generate the link
     * @throws WegasErrorMessage if 1) surveys belong to different GameModel; 2) no game; 3) no
     *                           account
     */
    public void sendSurveysInvitationAnonymouslyToList(List<SurveyDescriptor> surveys,
                                                       EmailAttributes email,
                                                       HttpServletRequest request) {

        if (!email.getRecipients().isEmpty()) {
            accountFacade.sendSurveyAnonymousTokens(email, surveys, request);
        } else {
            throw WegasErrorMessage.error("Unable to find accounts with email addresses", "WEGAS-INVITE-SURVEY-NO-EMAIL");
        }
    }

    /**
     * Create a new player within a team for the user identified by userId
     *
     * @param teamId    id of the team to join
     * @param userId    id of the user to create a player for, may be null to create an anonymous
     *                  player
     * @param languages
     * @return a new player, linked to a user, who just joined the team
     */
    public Player joinTeam(Long teamId, Long userId, List<Locale> languages) {
        // create player skeleton synchronously
        Long playerId = playerFacade.joinTeamAndCommit(teamId, userId, languages);

        // start async instances creation process
        populatorScheduler.scheduleCreation();

        Player player = playerFacade.find(playerId);
        int indexOf = populatorFacade.getPositionInQueue(player);
        player.setQueueSize(indexOf + 1);
        return player;
    }

    /**
     * Same as {@link #joinTeam(java.lang.Long, java.lang.Long, java.lang.String)} but anonymously.
     * (for testing purpose)
     *
     * @param teamId id of the team to join
     * @return a new player anonymous player who just joined the team
     */
    public Player joinTeam(Long teamId, List<Locale> languages) {
        Long id = requestManager.getCurrentUser().getId();
        logger.info("Adding user {} to team {}", id, teamId);
        return this.joinTeam(teamId, id, languages);
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
        stateMachineFacade.runStateMachines(game, true);
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
     * Find all users with a trainer access to a game
     *
     * @param id id of the game
     * @return
     */
    public List<User> findTrainers(Long id) {
        TypedQuery<User> query = this.getEntityManager().createNamedQuery("User.findByTransitivePermission", User.class);
        query.setParameter(1, "%:g" + id);
        return query.getResultList();
    }

    /**
     * Allow to access this facade event when there is no active CDI context.
     * <b>Please avoid that</b>
     *
     * @return GameFacade instance
     */
    public static GameFacade
    lookup() {
        try {
            return Helper.lookupBy(GameFacade.class
            );
        } catch (NamingException ex) {
            logger.error("Error retrieving game facade", ex);
            return null;
        }
    }

    /**
     * Since the team create is done in two step, we have to ensure the team is scheduled
     *
     * @param gameId
     * @param t
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
        //g = this.find(gameId);
        t.setCreatedBy(userFacade.getCurrentUser());
        //this.addRights(userFacade.getCurrentUser(), g);  // @fixme Should only be done for a player, but is done here since it will be needed in later requests to add a player
        getEntityManager().persist(t);

        return t.getId();
    }

    public XlsxSpreadsheet getXlsxOverview(Long gameId) {
        Game game = this.find(gameId);
        boolean includeTestPlayer = !game.getGameModel().isPlay();

        XlsxSpreadsheet xlsx = new XlsxSpreadsheet();
        xlsx.addSheet("players details");

        CellStyle headerStyle = xlsx.createHeaderStyle();
        xlsx.addValue("Team Name", headerStyle);
        xlsx.addValue("Team Notes", headerStyle);
        xlsx.addValue("Team Creation Date", headerStyle);
        xlsx.addValue("Team Status", headerStyle);
        xlsx.addValue("Player Name", headerStyle);
        xlsx.addValue("Player E-Mail", headerStyle);
        xlsx.addValue("Email verified", headerStyle);
        xlsx.addValue("Player Join Time", headerStyle);
        xlsx.addValue("Player Language", headerStyle);
        xlsx.addValue("Player Status", headerStyle);

        for (Team t : game.getTeams()) {
            if (t instanceof DebugTeam == false || includeTestPlayer) {
                for (Player p : t.getPlayers()) {
                    xlsx.newRow();
                    xlsx.addValue(t.getName());
                    xlsx.addValue(t.getNotes());

                    xlsx.addValue(t.getCreatedTime());
                    xlsx.addValue(t.getStatus().name());

                    xlsx.addValue(p.getName());
                    if (p.getUser() != null) {
                        xlsx.addValue(p.getUser().getMainAccount().getDetails().getEmail());
                        xlsx.addValue(Boolean.TRUE.equals(p.getUser().getMainAccount().isVerified()) ? "yes" : "no");
                    } else {
                        xlsx.skipCell();
                        xlsx.skipCell();
                    }
                    xlsx.addValue(p.getJoinTime());
                    xlsx.addValue(game.getGameModel().getLanguageByCode(p.getLang()).getLang());
                    xlsx.addValue(p.getStatus().name());
                }
            }
        }

        xlsx.autoWidth();
        loadOverviews(xlsx, game, includeTestPlayer);

        return xlsx;
    }

    private void loadOverviews(XlsxSpreadsheet xlsx, Game game, boolean includeTestPlayer) {
        Player p = game.getTestPlayer();
        String script
                = "var result= [];"
                + "if (WegasDashboard){"
                + "  result = WegasDashboard.getAllOverviews(true);"
                + "}"
                + "result;";

        CellStyle titleStyle = xlsx.createHeaderStyle();
        titleStyle.setAlignment(HorizontalAlignment.CENTER);

        CellStyle subtitleStyle = xlsx.createSmallerHeaderStyle();

        try (ScriptExecutionContext ctx = requestManager.switchToInternalExecContext(true)) {
            ScriptObjectMirror overviews = (ScriptObjectMirror) scriptFacade.eval(p, new Script(script), null);

            for (Object oSheet : overviews.values()) {
                ScriptObjectMirror sheetData = (ScriptObjectMirror) oSheet;

                String name = (String) sheetData.get("name"); // aka sheetName
                Sheet sheet = xlsx.addSheet(name);

                ScriptObjectMirror overview = (ScriptObjectMirror) sheetData.get("overview");

                ScriptObjectMirror structure = (ScriptObjectMirror) overview.get("structure");

                Collection<Object> groups = structure.values();
                // create first row : groups'

                Map<String, Integer> index = new HashMap<>(); // item name to col number
                Map<String, String> kinds = new HashMap<>(); // item name to item kind

                Row firstRow = xlsx.getCurrentRow();
                Row secondRow = xlsx.newRow();

                Cell teamName = secondRow.createCell(0);
                teamName.setCellValue("Team Name");
                teamName.setCellStyle(subtitleStyle);

                int currentCol = 1;

                // write headers
                for (Object oGroup : groups) {
                    ScriptObjectMirror group = (ScriptObjectMirror) oGroup;
                    String title = (String) group.get("title");

                    int startGroupCol = currentCol;

                    Collection<Object> items = (Collection<Object>) (((ScriptObjectMirror) group.get("items")).values());
                    for (Object oItem : items) {
                        ScriptObjectMirror item = (ScriptObjectMirror) oItem;
                        if (item.hasMember("kind")) {
                            // skip action/method
                            String itemLabel = (String) item.get("label");
                            String itemId = (String) item.get("id");

                            Cell itemTitle = secondRow.createCell(currentCol);
                            itemTitle.setCellStyle(subtitleStyle);
                            itemTitle.setCellValue(itemLabel);

                            index.put(itemId, currentCol);
                            kinds.put(itemId, (String) item.get("kind"));

                            currentCol++;
                        }
                    }
                    if (currentCol - 1 > startGroupCol) {
                        Cell groupName = firstRow.createCell(startGroupCol);
                        groupName.setCellValue(title);
                        groupName.setCellStyle(titleStyle);

                        sheet.addMergedRegion(new CellRangeAddress(0, 0, startGroupCol, currentCol - 1));
                    }
                }
                xlsx.setCurrentRowNumber(1); // focus second row

                // write data
                ScriptObjectMirror data = (ScriptObjectMirror) overview.get("data");
                for (String teamId : data.keySet()) {
                    Team team = teamFacade.find(Long.parseLong(teamId));
                    if (team instanceof DebugTeam == false || includeTestPlayer) {
                        xlsx.newRow();
                        String tName = team.getName();
                        xlsx.addValue(tName);

                        ScriptObjectMirror teamData = (ScriptObjectMirror) data.get(teamId);
                        for (String itemId : teamData.keySet()) {
                            Integer itemCol = index.get(itemId);
                            if (itemCol != null) {
                                String kind = kinds.get(itemId);

                                Object value = teamData.get(itemId);

                                if (kind.equals("inbox") || kind.equals("text")) {
                                    value = ((ScriptObjectMirror) value).getMember("body");
                                }

                                xlsx.setCurrentColumnNumber(itemCol);
                                xlsx.addValue(value);
                            }
                        }
                    }
                }
                xlsx.autoWidth();
            }
        }
    }
}
