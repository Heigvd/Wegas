/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.api.RequestManagerI;
import com.wegas.core.ejb.statemachine.StateMachineEventCounter;
import com.wegas.core.event.client.ClientEvent;
import com.wegas.core.event.client.CustomEvent;
import com.wegas.core.event.client.ExceptionEvent;
import com.wegas.core.exception.client.WegasAccessDenied;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.aai.AaiRealm;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestRealm;
import com.wegas.core.security.jparealm.JpaRealm;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.util.*;
import java.util.Map.Entry;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.inject.Named;
import javax.naming.NamingException;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.script.ScriptContext;
import javax.ws.rs.core.Response;
import jdk.nashorn.api.scripting.ScriptUtils;
import jdk.nashorn.internal.runtime.ScriptObject;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.UnavailableSecurityManagerException;
import org.apache.shiro.mgt.DefaultSecurityManager;
import org.apache.shiro.realm.Realm;
import org.apache.shiro.subject.SimplePrincipalCollection;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.util.ThreadContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

//import javax.annotation.PostConstruct;
/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Named("RequestManager")
@RequestScoped
public class RequestManager implements RequestManagerI {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    public EntityManager getEntityManager() {
        return em;
    }

    public enum RequestEnvironment {
        STD, // Standard request from standard client (ie a browser)
        TEST, // Testing Request from standard client
        INTERNAL // Internal Process (timer, etc)
    }

    /*
    @Resource
    private TransactionSynchronizationRegistry txReg;
     */
    @Inject
    ConcurrentHelper concurrentHelper;

    @Inject
    private GameModelFacade gameModelFacade;

    @Inject
    private GameFacade gameFacade;

    @Inject
    private TeamFacade teamFacade;

    @Inject
    private PlayerFacade playerFacade;

    @Inject
    private UserFacade userFacade;

    @Inject
    private AccountFacade accountFacade;

    @Inject
    private RequestFacade requestFacade;

    private static Logger logger = LoggerFactory.getLogger(RequestManager.class);

    private RequestEnvironment env = RequestEnvironment.STD;

    /**
     *
     */
    private Class view = Views.Public.class;

    /**
     *
     */
    private Player currentPlayer;
    private User currentUser;
    private Long currentPrincipal;

    private String requestId;
    private String socketId;
    private String method;
    private String path;
    private Long startTimestamp;
    private Long managementStartTime;
    private Long serialisationStartTime;
    private Long propagationStartTime;
    private Long propagationEndTime;

    private Response.StatusType status;
    private Long exceptionCounter = 0L;

    /**
     * Contains all updated entities
     */
    private Map<String, List<AbstractEntity>> updatedEntities = new HashMap<>();

    private Map<String, List<AbstractEntity>> outdatedEntities = new HashMap<>();

    private Map<String, List<AbstractEntity>> destroyedEntities = new HashMap<>();

    private Collection<String> grantedPermissions = new HashSet<>();
    private Collection<String> effectiveDBPermissions;
    private Collection<String> effectiveRoles;

    /**
     * Map TOKEN -> Audience
     */
    private final Map<String, List<String>> lockedToken = new HashMap<>();

    /**
     *
     */
    private List<ClientEvent> events = new ArrayList<>();

    /**
     *
     */
    private Locale locale;

    /**
     *
     */
    private ScriptContext currentScriptContext = null;

    private static int logIndent = 0;

    private static void log(String msg, Object... args) {
        if (logger.isTraceEnabled()) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < logIndent; i++) {
                sb.append("  ");
            }
            sb.append(msg);
            logger.trace(sb.toString(), (Object[]) args);
        }
    }

    private final StateMachineEventCounter eventCounter = new StateMachineEventCounter();

    public RequestEnvironment getEnv() {
        return env;
    }

    public void setEnv(RequestEnvironment env) {
        this.env = env;
    }

    @Override
    public boolean isTestEnv() {
        return this.env == RequestEnvironment.TEST;
    }

    public void addUpdatedEntities(Map<String, List<AbstractEntity>> entities) {
        this.addEntities(entities, updatedEntities);
    }

    public void addOutofdateEntities(Map<String, List<AbstractEntity>> entities) {
        this.addEntities(entities, outdatedEntities);
    }

    public void addDestroyedEntities(Map<String, List<AbstractEntity>> entities) {
        this.addEntities(entities, destroyedEntities);
    }

    private void addEntities(Map<String, List<AbstractEntity>> entities, Map<String, List<AbstractEntity>> container) {
        if (entities != null) {
            for (Map.Entry<String, List<AbstractEntity>> entry : entities.entrySet()) {
                this.addEntities(entry.getKey(), entry.getValue(), container);
            }
        }
    }

    private void addEntities(String audience, List<AbstractEntity> updated, Map<String, List<AbstractEntity>> container) {
        for (AbstractEntity entity : updated) {
            this.addEntity(audience, entity, container);
        }
    }

    public boolean contains(Map<String, List<AbstractEntity>> container, AbstractEntity entity) {
        for (List<AbstractEntity> entities : container.values()) {
            if (entities.contains(entity)) {
                return true;
            }
        }
        return false;
    }

    private void removeEntityFromContainer(Map<String, List<AbstractEntity>> container, AbstractEntity entity) {
        for (List<AbstractEntity> entities : container.values()) {
            if (entities.contains(entity)) {
                logger.debug("remove {}", entity);
                entities.remove(entity);
            }
        }
    }

    public void addEntity(String audience, AbstractEntity entity, Map<String, List<AbstractEntity>> container) {

        boolean add = true;
        if (container == destroyedEntities) {
            removeEntityFromContainer(updatedEntities, entity);
        } else if (container == updatedEntities) {
            if (contains(destroyedEntities, entity)) {
                add = false;
            }
        }

        if (add) {
            if (!container.containsKey(audience)) {
                container.put(audience, new ArrayList<>());
            }
            // make sure to add up to date entity
            List<AbstractEntity> entities = container.get(audience);
            if (entities.contains(entity)) {
                entities.remove(entity);
            }
            entities.add(entity);
        }
    }

    /**
     * @return the currentPlayer
     */
    @Override
    public Player getPlayer() {
        return currentPlayer;
    }

    /**
     * @return a User entity, based on the shiro login state
     */
    @Override
    public User getCurrentUser() {
        final Subject subject = SecurityUtils.getSubject();
        Long principal = (Long) subject.getPrincipal();
        if (this.currentUser == null || currentPrincipal == null || !currentPrincipal.equals(principal)) {
            this.clearPermissions();
            try {
                if (subject.isRemembered() || subject.isAuthenticated()) {
                    AbstractAccount account = accountFacade.find(principal);
                    if (account != null) {
                        this.currentUser = account.getUser();
                        this.currentPrincipal = principal;
                    }
                }
            } catch (Exception ex) {
                logger.error("FAILS TO FETCH CURRENT USER", ex);
                this.currentUser = null;
                this.currentPrincipal = null;
            }
        }

        if (this.currentUser != null) {
            // if there is an entityManager and if the currentUser is not managed -> get a managed one
            try {
                if (this.em != null && !this.em.contains(this.currentUser)) {
                    this.currentUser = userFacade.find(this.currentUser.getId());
                    this.clearEffectivePermisssions();
                }
            } catch (NullPointerException npe) {
                // thrown when ran withoud EJBcontext
            }
            return this.currentUser;
        } else {
            return null;
        }
    }

    public User getLocalCurrentUser() {
        return this.currentUser;
    }

    /**
     * @param currentPlayer the currentPlayer to set
     */
    public void setPlayer(Player currentPlayer) {
        if (this.currentPlayer == null || !this.currentPlayer.equals(currentPlayer)) {
            this.setCurrentScriptContext(null);
        }
        this.currentPlayer = currentPlayer != null ? (currentPlayer.getId() != null ? playerFacade.find(currentPlayer.getId()) : currentPlayer) : null;
    }

    /**
     * @return
     */
    public GameModel getCurrentGameModel() {
        return this.getPlayer().getGameModel();
    }

    /**
     * @return the currentScriptContext
     */
    public ScriptContext getCurrentScriptContext() {
        return currentScriptContext;
    }

    /**
     * @param currentScriptContext the currentScriptContext to set
     */
    public void setCurrentScriptContext(ScriptContext currentScriptContext) {
        this.currentScriptContext = currentScriptContext;
    }

    public StateMachineEventCounter getEventCounter() {
        return eventCounter;
    }

    public void clearEntities() {
        this.clearUpdatedEntities();
        this.clearDestroyedEntities();
        this.clearOutdatedEntities();
    }

    /**
     *
     */
    public void clearUpdatedEntities() {
        this.updatedEntities.clear();
    }

    /**
     * @return
     */
    public Map<String, List<AbstractEntity>> getUpdatedEntities() {
        return updatedEntities;
    }

    /**
     *
     */
    public void clearDestroyedEntities() {
        this.destroyedEntities.clear();
    }

    public Map<String, List<AbstractEntity>> getDestroyedEntities() {
        return destroyedEntities;
    }

    public void clearOutdatedEntities() {
        this.outdatedEntities.clear();
    }

    public Map<String, List<AbstractEntity>> getOutdatedEntities() {
        return outdatedEntities;
    }

    /**
     * @return
     */
    public List<ClientEvent> getClientEvents() {
        return events;
    }

    /**
     * @param event
     */
    public void addEvent(ClientEvent event) {
        this.events.add(event);
    }

    /**
     * @param e
     */
    public void addException(WegasRuntimeException e) {
        ArrayList<WegasRuntimeException> exceptions = new ArrayList<>();
        exceptions.add(e);
        this.exceptionCounter++;
        this.addEvent(new ExceptionEvent(exceptions));
    }

    /**
     * Method used to send custom events
     *
     * @param type    event name
     * @param payload object associated with that event
     */
    @Override
    public void sendCustomEvent(String type, Object payload) {
        // @hack check payload type against "jdk.nashorn.internal"
        if (payload.getClass().getName().startsWith("jdk.nashorn.internal")) {
            this.addEvent(new CustomEvent(type, ScriptUtils.wrap((ScriptObject) payload)));
        } else {
            this.addEvent(new CustomEvent(type, payload));
        }
    }

    public Long getExceptionCounter() {
        return exceptionCounter;
    }

    public void setExceptionCounter(Long exceptionCounter) {
        this.exceptionCounter = exceptionCounter;
    }

    /**
     * @return the view
     */
    public Class getView() {
        return view;
    }

    /**
     * @param view the view to set
     */
    public void setView(Class view) {
        this.view = view;
    }

    /**
     * @param bundle
     *
     * @return the ResourceBundle
     */
    public ResourceBundle getBundle(String bundle) {
        return ResourceBundle.getBundle(bundle, this.locale);
    }

    /**
     * @return the local
     */
    @Override
    public Locale getLocale() {
        return locale;
    }

    /**
     * @param local the local to set
     */
    @Override
    public void setLocale(Locale local) {
        this.locale = local;
    }

    private String getAudience(InstanceOwner target) {
        if (target != null) {
            if (this.hasPermission(target.getAssociatedReadPermission())) {
                return target.getChannel();
            } else {
                throw WegasErrorMessage.error("You don't have the right to lock " + target);
            }
        }
        return null;
    }

    private String getEffectiveAudience(String audience) {
        if (audience != null && !audience.isEmpty()) {
            return audience;
        } else {
            return "internal";
        }
    }

    /**
     * Try to Lock the token. Non-blocking. Return true if token has been
     * locked, false otherwise
     *
     * @param token
     *
     * @return
     */
    @Override
    public boolean tryLock(String token) {
        return tryLock(token, null);
    }

    /**
     *
     * @param token  token to tryLock
     * @param target scope to inform about the lock
     *
     * @return
     */
    public boolean tryLock(String token, InstanceOwner target) {
        String audience = getAudience(target);
        logger.debug("TryLock \"{}\" for \"{}\"", token, audience);
        boolean tryLock = concurrentHelper.tryLock(token, audience);
        if (tryLock) {
            logger.debug(" -> LOCKED");
            // Only register token if successfully locked
            if (!lockedToken.containsKey(token)) {
                logger.debug("   -> NEW LOCK");
                lockedToken.put(token, new ArrayList());
            }
            this.registerLocalLock(token, audience);
        }
        return tryLock;
    }

    /**
     *
     * @param token token to lock
     */
    @Override
    public void lock(String token) {
        this.lock(token, null);
    }

    private void registerLocalLock(String token, String audience) {
        String effectiveAudience = getEffectiveAudience(audience);
        logger.debug("Register Local Lock: {} -> {}", token, effectiveAudience);
        lockedToken.get(token).add(effectiveAudience);
    }

    /**
     *
     * @param token  token to lock
     * @param target scope to inform about the lock
     */
    @Override
    public void lock(String token, InstanceOwner target) {
        String audience = getAudience(target);
        logger.debug("LOCK \"{}\" for \"{}\"", token, audience);
        concurrentHelper.lock(token, audience);
        if (!lockedToken.containsKey(token)) {
            lockedToken.put(token, new ArrayList());
        }
        this.registerLocalLock(token, audience);
    }

    /**
     *
     * @param token token to release
     */
    @Override
    public void unlock(String token) {
        this.unlock(token, null);
    }

    /**
     *
     * @param token  token to release
     * @param target scope to inform about the lock
     */
    @Override
    public void unlock(String token, InstanceOwner target) {
        String audience = getAudience(target);
        logger.debug("UNLOCK \"{}\" for \"{}\"", token, audience);
        concurrentHelper.unlock(token, audience);
        if (lockedToken.containsKey(token)) {
            List<String> audiences = lockedToken.get(token);

            String effectiveAudience = getEffectiveAudience(audience);
            logger.debug("Remove Local Lock: \"{}\" -> \"{}\"", token, effectiveAudience);
            audiences.remove(effectiveAudience);
            if (audiences.isEmpty()) {
                logger.debug("Remove Local Lock COMPLETELY: \"{}\"", token);
                lockedToken.remove(token);
            }
        }
    }

    public Collection<String> getTokensByAudiences(List<String> audiences) {
        return concurrentHelper.getTokensByAudiences(audiences);
    }

    public void setStatus(Response.StatusType statusInfo) {
        this.status = statusInfo;
    }

    private void markProcessingStartTime() {
        this.startTimestamp = System.currentTimeMillis();
    }

    /**
     * before ManagedModeResponseFilter
     */
    public void markManagermentStartTime() {
        this.managementStartTime = System.currentTimeMillis();
    }

    /**
     * after ManagedModeResponseFilter
     */
    public void markSerialisationStartTime() {
        this.serialisationStartTime = System.currentTimeMillis();
    }

    /**
     * after ManagedModeResponseFilter
     */
    public void markPropagationStartTime() {
        this.propagationStartTime = System.currentTimeMillis();
    }

    /**
     * after Propagation
     */
    public void markPropagationEndTime() {
        this.propagationEndTime = System.currentTimeMillis();
    }

    public void setRequestId(String uniqueIdentifier) {
        this.requestId = uniqueIdentifier;
    }

    public String getRequestId() {
        return requestId;
    }

    public String getSocketId() {
        return socketId;
    }

    public void setSocketId(String socketId) {
        this.socketId = socketId;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }

    private void logRequest() {
        long endTime = System.currentTimeMillis();

        long totalDuration = endTime - this.startTimestamp;

        Long mgmtTime;
        Long propagationTime;

        String processingDuration;
        String managementDuration;
        String propagationDuration;
        String serialisationDuration;

        mgmtTime = this.serialisationStartTime != null && this.managementStartTime != null ? (this.serialisationStartTime - this.managementStartTime) : null;
        propagationTime = this.propagationEndTime != null ? (this.propagationEndTime - this.propagationStartTime) : null;

        if (propagationTime != null) {
            //If propagation occurs, deduct its duration from managementTime because
            //management includes propagation
            mgmtTime -= propagationTime;
            propagationDuration = Long.toString(propagationTime);
        } else {
            propagationDuration = " N/A";
        }

        processingDuration = this.managementStartTime != null ? Long.toString(this.managementStartTime - this.startTimestamp) : "N/A";
        managementDuration = mgmtTime != null ? Long.toString(mgmtTime) : "N/A";
        serialisationDuration = this.serialisationStartTime != null ? Long.toString(endTime - this.serialisationStartTime) : "N/A";

        Team currentTeam = null;
        if (currentPlayer != null) {
            currentTeam = currentPlayer.getTeam();
        }

        String info = "[" + (currentUser != null ? currentUser.getId() : "anonymous") + "::"
                + (currentPlayer != null ? currentPlayer.getId() : "n/a") + "::"
                + (currentTeam != null ? currentTeam.getId() : "n/a") + "]";

        RequestManager.logger.info("Request [{}] \"{} {}\" for {} processed in {} ms ( processing: {}; management: {}, propagation: {}, serialisation: {}) => {}",
                this.requestId, this.getMethod(), this.getPath(), info, totalDuration, processingDuration, managementDuration, propagationDuration, serialisationDuration, this.status);
    }

    /**
     * Lifecycle
     */
    @PostConstruct
    public void postConstruct() {
        this.markProcessingStartTime();
    }

    public void clear() {
        this.getEntityManager().clear();
    }

    @PreDestroy
    public void preDestroy() {
        this.clearPermissions();
        for (Entry<String, List<String>> entry : lockedToken.entrySet()) {
            logger.debug("PreDestroy Unlock: key: {}", entry.getKey());
            for (String audience : entry.getValue()) {
                logger.debug("->ConcurrentHelper unlockFull for {}", audience);
                concurrentHelper.unlockFull(entry.getKey(), audience);
            }
        }
        if (this.currentScriptContext != null) {
            this.currentScriptContext.getBindings(ScriptContext.ENGINE_SCOPE).clear();
            this.currentScriptContext = null;
        }

        this.logRequest();

        //this.getEntityManager().flush();
        this.clear();
    }

    @Override
    public void commit(Player player) {
        this.requestFacade.commit(player);
    }

    @Override
    public void commit() {
        this.requestFacade.commit(this.getPlayer());
    }

    /**
     * @param millis
     *
     * @throws java.lang.InterruptedException
     */
    @Override
    public void pleaseWait(long millis) throws InterruptedException {
        if (millis > 0) {
            TimeUnit.MILLISECONDS.sleep(millis);
        }
    }

    /**
     * Security
     */
    private String[] split(String permissions) {
        return permissions.split(",");
    }

    public void clearPermissions() {
        log("CLEAR PERMISSIONS");
        log("*********************************************************");
        this.grantedPermissions.clear();
        this.clearEffectivePermisssions();
    }

    public void clearEffectivePermisssions() {

        if (this.effectiveRoles != null) {
            this.effectiveRoles.clear();
            this.effectiveRoles = null;
        }

        if (this.effectiveDBPermissions != null) {
            this.effectiveDBPermissions.clear();
            this.effectiveDBPermissions = null;
        }
    }

    public Collection<String> getEffectiveRoles() {
        if (this.effectiveRoles == null) {
            User user = this.getCurrentUser();
            effectiveRoles = new HashSet<>();
            //for (String p : userFacade.findRoles_native(user)) {
            if (user != null) {
                for (Role p : userFacade.findRolesTransactional(user.getId())) {
                    effectiveRoles.add(p.getName());
                }
            }
        }

        return effectiveRoles;
    }

    public Collection<String> getEffectiveDBPermissions() {
        if (this.effectiveDBPermissions == null) {
            User user = this.getCurrentUser();
            effectiveDBPermissions = new HashSet<>();
            if (user != null) {
                for (Permission p : userFacade.findAllUserPermissionsTransactional(user.getId())) {
                    effectiveDBPermissions.add(p.getValue());
                }
            }
        }

        return effectiveDBPermissions;
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public boolean hasRole(String roleName) {
        return this.getEffectiveRoles().contains(roleName);
    }

    public void checkPermission(String permission) {
        if (!isPermitted(permission)) {
            throw new WegasAccessDenied(null, null, permission, currentUser);
        }
    }

    public boolean isPermitted(String permission) {
        String[] pSplit = permission.split(":");

        if (pSplit.length == 3) {
            Collection<String> perms = this.getEffectiveDBPermissions();

            for (String p : perms) {
                String[] split = p.split(":");
                if (split.length == 3) {
                    if (split[0].equals(pSplit[0])
                            && (split[1].equals("*") || split[1].contains(pSplit[1])) // Not so happy with "contains" -> DO a f*ckin good regex to handle all cases
                            && (split[2].equals("*") || split[2].equals(pSplit[2]))) {
                        return true;
                    }

                }
            }
        }
        return false;
    }

    private boolean hasDirectGameModelEditPermission(GameModel gameModel) {
        return this.isPermitted("GameModel:Edit:gm" + gameModel.getId());
    }

    private boolean hasDirectGameEditPermission(Game game) {
        return this.isPermitted("Game:Edit:g" + game.getId());
    }

    private boolean hasGamePermission(Game game, boolean superPermission) {

        if (game instanceof DebugGame) {
            // when checked against a DebugGame, must have scenarist rights
            return this.hasGameModelPermission(game.getGameModel(), superPermission);
        } else {
            return !(game.isPersisted() || gameFacade.isPersisted(game.getId())) // game is a new one (only exists wihin this very transaction)
                    || this.hasDirectGameEditPermission(game) //has edit right on  the game
                    || this.hasDirectGameModelEditPermission(game.getGameModel()) // or edit right on the game model
                    || (!superPermission
                    && ( // OR if no super permission is required. either: 
                    game.getAccess().equals(Game.GameAccess.OPEN) // the game is open and hence, must be readable to everyone
                    || playerFacade.isInGame(game.getId(), this.getCurrentUser().getId()) // current user owns one player in the game
                    ));
        }
    }

    private boolean hasGameModelPermission(GameModel gameModel, boolean superPermission) {
        if (!(gameModel.isPersisted() || gameModelFacade.isPersisted(gameModel.getId())) || hasDirectGameModelEditPermission(gameModel)) {
            return true;
        } else if (gameModel.getStatus().equals(GameModel.Status.PLAY)) {
            /**
             * GameModel permission against a "PLAY" gameModel.
             */
            for (Game game : gameModel.getGames()) {
                // has permission to at least on game of the game model ?
                if (this.hasGamePermission(game, superPermission)) {
                    return true;
                }
            }
            return false;
        } else {
            /**
             * GameModel permission against a true gameModel.
             */

            long id = gameModel.getId();
            if (superPermission) {
                return hasDirectGameModelEditPermission(gameModel);
            } else {
                if (this.hasRole("Scenarist") && (this.isPermitted("GameModel:Instantiate:gm" + id) || this.isPermitted("GameModel:Duplicate:gm" + id))) {
                    //For scenarist, instantiate and duplicate means read
                    return true;
                } else if (this.hasRole("Trainer") && this.isPermitted("GameModel:Instantiate:gm" + id)) {
                    //For trainer, instantiate means read
                    return true;
                }
                // fallback: View means View
                return this.isPermitted("GameModel:View:gm" + id);
            }
        }
    }

    /**
     * Check if current user has access to type/id entity
     *
     * @param type
     * @param id
     * @param currentPlayer
     *
     * @return true if current user has access to
     */
    private boolean hasPermission(String type, String arg, boolean superPermission) {
        //Make sure to have up to date user
        this.getCurrentUser();

        if (this.hasRole("Administrator")) {
            return true;
        } else if ("Role".equals(type)) {
            return this.hasRole(arg);
        } else {
            Long id = Long.parseLong(arg);

            if ("GameModel".equals(type)) {

                GameModel gameModel = gameModelFacade.find(id);
                return this.hasGameModelPermission(gameModel, superPermission);
            } else if ("Game".equals(type)) {
                Game game = gameFacade.find(id);
                return this.hasGamePermission(game, superPermission);
            } else if ("Team".equals(type)) {

                Team team = teamFacade.find(id);

                return team != null && ((currentUser != null && (playerFacade.isInTeam(team.getId(), currentUser.getId()) // Current logged User is linked to a player who's member of the team
                        || currentUser.equals(team.getCreatedBy()) // or current user is the team creator
                        )
                        || this.hasGamePermission(team.getGame(), superPermission))); // or read (or write for superP) right one the game

            } else if ("Player".equals(type)) {
                Player player = playerFacade.find(id);

                // Current player belongs to current user || current user is the teacher or scenarist (test user)
                return player != null && ((currentUser != null && currentUser.equals(player.getUser())) || this.hasGamePermission(player.getGame(), superPermission));
            } else if ("User".equals(type)) {
                User find = userFacade.find(id);
                return currentUser != null && currentUser.equals(find);
            }
        }
        return false;
    }

    /**
     * can current user subscribe to given channel ?
     *
     * @param permission Role-<rolename> | ((User|Player|Team|Game|GameModel) - (Read | Write) - <entityId>)
     *
     * @return true if access granted
     */
    public boolean hasPermission(String permission) {
        if (permission != null) {
            if (grantedPermissions.contains(permission)) {
                log(" WAS ALREADY GRANTED");
                return true;
            } else {

                String[] split = permission.split("-");

                if (split.length == 3) {
                    if (hasPermission(split[0], split[2], split[1].contains("Write"))) {
                        log(" >>> GRANT: {}", permission);
                        grantedPermissions.add(permission);
                    }
                }
                return grantedPermissions.contains(permission);
            }
        } else {
            log(" NULL PERMISSION");
            return true;
        }
    }

    private boolean userHasPermission(String permissions, String type, AbstractEntity entity) {
        // null means no permission required
        if (permissions != null) {
            /*
             * not null value means at least one permission from the list.
             * Hence, empty string "" means forbidden, even for admin
             */
            String perms[] = this.split(permissions);
            for (String perm : perms) {
                if (this.hasPermission(perm)) {
                    return true;
                }
            }
            return false;
        }
        log("NO PERMISSIONS REQUIERED");
        return true;
    }

    private void assertUserHasPermission(String permissions, String type, AbstractEntity entity) {
        log("HAS  PERMISSION: {} / {} / {}", type, permissions, entity);
        logIndent++;
        if (!userHasPermission(permissions, type, entity)) {
            String msg = type + " Permission Denied (" + permissions + ") for user " + this.getCurrentUser() + " on entity " + entity;
            Helper.printWegasStackTrace(new Exception(msg));
            log(msg);
            throw new WegasAccessDenied(entity, type, permissions, this.getCurrentUser());
        }
        logIndent--;
    }

    public void assertCreateRight(AbstractEntity entity) {
        this.assertUserHasPermission(entity.getRequieredCreatePermission(), "Create", entity);
    }

    public void assertReadRight(AbstractEntity entity) {
        this.assertUserHasPermission(entity.getRequieredReadPermission(), "Read", entity);
    }

    public void assertUpdateRight(AbstractEntity entity) {
        this.assertUserHasPermission(entity.getRequieredUpdatePermission(), "Update", entity);
    }

    public void assertDeleteRight(AbstractEntity entity) {
        this.assertUserHasPermission(entity.getRequieredDeletePermission(), "Delete", entity);
    }

    /*
     * Security Sugars
     */
    public boolean isAdmin() {
        return this.hasRole("Administrator");
    }

    public boolean hasGameReadRight(final Game game) {
        return this.hasPermission(game.getAssociatedReadPermission());
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public boolean hasGameWriteRight(final Game game) {
        return this.hasPermission(game.getAssociatedWritePermission());
    }

    public boolean hasGameModelReadRight(final GameModel gameModel) {
        return this.hasPermission(gameModel.getAssociatedReadPermission());
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public boolean hasGameModelWriteRight(final GameModel gameModel) {
        return this.hasPermission(gameModel.getAssociatedWritePermission());
    }

    public boolean hasTeamRight(final Team team) {
        return this.hasPermission(team.getAssociatedReadPermission());
    }

    public boolean hasPlayerRight(final Player player) {
        return this.hasPermission(player.getAssociatedReadPermission());
    }

    public boolean canRestoreGameModel(final GameModel gameModel) {
        String id = "gm" + gameModel.getId();
        return this.isPermitted("GameModel:View:" + id)
                || this.isPermitted("GameModel:Edit" + id)
                || this.isPermitted("GameModel:Instantiate:" + id)
                || this.isPermitted("GameModel:Duplicate:" + id);
    }

    public boolean canDeleteGameModel(final GameModel gameModel) {
        String id = "gm" + gameModel.getId();
        return this.isPermitted("GameModel:Delete:" + id);
    }

    public boolean hasChannelPermission(String channel) {
        if (channel != null) {
            Pattern p = Pattern.compile("^(private-)*([a-zA-Z]*)-([a-zA-Z0-9]*)$");

            Matcher m = p.matcher(channel);
            if (m.find()) {
                return this.hasPermission(m.group(2), m.group(3), false);
            }
        }
        return false;
    }


    /*
     * Security Assertions
     */
    public void assertGameTrainer(final Game game) {
        if (!hasGameWriteRight(game)) {
            throw new WegasAccessDenied(game, "Trainer", "W-" + game.getChannel(), this.getCurrentUser());
        }
    }

    /**
     * Does the current user have read right on the game model
     *
     * @param gameModel gameModel to check right against
     */
    public void assertCanReadGameModel(final GameModel gameModel) {
        if (!hasGameModelReadRight(gameModel)) {
            throw new WegasAccessDenied(gameModel, "Read", gameModel.getChannel(), this.getCurrentUser());
        }
    }

    /**
     * Become superuser
     *
     * @return
     */
    public User su() {
        return this.su(1l);
    }

    /**
     * Log-in with a different account
     *
     * @param accountId
     *
     * @return new currentUser
     */
    public User su(Long accountId) {
        try {
            Subject subject = SecurityUtils.getSubject();

            if (subject.getPrincipal() != null) {
                logger.info("SU: User {} SU to {}", subject.getPrincipal(), accountId);
                if (this.isAdmin()) {
                    // The subject exists and is an authenticated admin
                    // -> Shiro runAs
                    //subject.checkRole("Administrator");
                    if (subject.isRunAs()) {
                        subject.releaseRunAs();
                    }
                    SimplePrincipalCollection newSubject = new SimplePrincipalCollection(accountId, "jpaRealm");
                    subject.runAs(newSubject);
                    return this.getCurrentUser();
                } else {
                    throw WegasErrorMessage.error("Su is forbidden !");
                }
            }
        } catch (UnavailableSecurityManagerException | IllegalStateException | NullPointerException ex) {
            // runAs faild
            Helper.printWegasStackTrace(ex);
        }

        // The subject does not exists -> create from strach and bind
        Collection<Realm> realms = new ArrayList<>();
        realms.add(new JpaRealm());
        realms.add(new AaiRealm());
        realms.add(new GuestRealm());

        SecurityUtils.setSecurityManager(new DefaultSecurityManager(realms));

        Subject.Builder b = new Subject.Builder();
        SimplePrincipalCollection newSubject = new SimplePrincipalCollection(accountId, "jpaRealm");
        b.authenticated(true).principals(newSubject);

        Subject buildSubject = b.buildSubject();
        logger.info("SU: No-User SU to {}, {}", buildSubject.getPrincipal(), Thread.currentThread());

        ThreadContext.bind(buildSubject);

        return this.getCurrentUser();
    }

    public void releaseSu() {
        try {
            Subject subject = SecurityUtils.getSubject();
            if (subject.isRunAs()) {
                logger.info("Su-Exit: User {} releases {}", subject.getPreviousPrincipals().toString(), subject.getPrincipal());
                subject.releaseRunAs();
            } else {
                logger.info("Su-Exit LOGOUT");
                subject.logout();
            }
            this.getCurrentUser();
        } catch (Exception ex) {
            logger.error("EX: ", ex);
        }
    }

    /**
     * CDI Lookup
     * Used by GameModel#can{Edit,View,Instantiate,Duplicate} pieces of shit
     *
     * @return
     */
    public static RequestManager lookup() {
        try {
            return Helper.lookupBy(RequestManager.class);
        } catch (NamingException ex) {
            return null;
        }
    }
}
