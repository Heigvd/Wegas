/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.statemachine.StateMachineEventCounter;
import com.wegas.core.event.client.ClientEvent;
import com.wegas.core.event.client.CustomEvent;
import com.wegas.core.event.client.ExceptionEvent;
import com.wegas.core.exception.client.WegasAccessDenied;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.BroadcastTarget;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.SecurityHelper;
import jdk.nashorn.api.scripting.ScriptUtils;
import jdk.nashorn.internal.runtime.ScriptObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.ejb.DependsOn;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.inject.Named;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.script.ScriptContext;
import javax.ws.rs.core.Response;
import java.util.*;
import java.util.Map.Entry;
import java.util.concurrent.TimeUnit;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;

//import javax.annotation.PostConstruct;
/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Named("RequestManager")
@RequestScoped
@DependsOn("MutexSingleton")
public class RequestManager {

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
    private MutexSingleton mutexSingleton;

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

    private static void log(String msg, int level) {
        if (level < 5) {
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < logIndent; i++) {
                sb.append("  ");
            }
            sb.append(msg);
            logger.error(sb.toString());
        }
    }

    private final StateMachineEventCounter eventCounter = new StateMachineEventCounter();

    public RequestEnvironment getEnv() {
        return env;
    }

    public void setEnv(RequestEnvironment env) {
        this.env = env;
    }

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

    public void addEntity(String audience, AbstractEntity updated, Map<String, List<AbstractEntity>> container) {
        if (!container.containsKey(audience)) {
            container.put(audience, new ArrayList<>());
        }
        List<AbstractEntity> entities = container.get(audience);
        if (entities.contains(updated)) {
            entities.remove(updated);
        }
        entities.add(updated);
    }

    /**
     * @return the currentPlayer
     */
    public Player getPlayer() {
        return currentPlayer;
    }

    /**
     * @return a User entity, based on the shiro login state
     */
    public User getCurrentUser() {
        final Subject subject = SecurityUtils.getSubject();
        Long principal = (Long) subject.getPrincipal();
        if (this.currentUser == null || currentPrincipal == null || !currentPrincipal.equals(principal)) {
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
            return userFacade.find(this.currentUser.getId());
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
     * @return the ResourceBundle
     */
    public ResourceBundle getBundle(String bundle) {
        return ResourceBundle.getBundle(bundle, this.locale);
    }

    /**
     * @return the local
     */
    public Locale getLocale() {
        return locale;
    }

    /**
     * @param local the local to set
     */
    public void setLocale(Locale local) {
        this.locale = local;
    }

    private String getAudienceToLock(BroadcastTarget target) {
        if (target != null) {
            String channel = target.getChannel();
            if (this.hasPermission(channel)) {
                return channel;
            } else {
                throw WegasErrorMessage.error("You don't have the right to lock " + channel);
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
     * @return
     */
    public boolean tryLock(String token) {
        return tryLock(token, null);
    }

    /**
     *
     * @param token  token to tryLock
     * @param target scope to inform about the lock
     * @return
     */
    public boolean tryLock(String token, BroadcastTarget target) {
        String audience = getAudienceToLock(target);
        boolean tryLock = mutexSingleton.tryLock(token, audience);
        if (tryLock) {
            // Only register token if successfully locked
            if (!lockedToken.containsKey(token)) {
                lockedToken.put(token, new ArrayList());
            }
            lockedToken.get(token).add(getEffectiveAudience(audience));
        }
        return tryLock;
    }

    /**
     *
     * @param token token to lock
     */
    public void lock(String token) {
        this.lock(token, null);
    }

    /**
     *
     * @param token  token to lock
     * @param target scope to inform about the lock
     */
    public void lock(String token, BroadcastTarget target) {
        String audience = getAudienceToLock(target);
        mutexSingleton.lock(token, audience);
        if (!lockedToken.containsKey(token)) {
            lockedToken.put(token, new ArrayList());
        }
        lockedToken.get(token).add(getEffectiveAudience(audience));
    }

    /**
     *
     * @param token token to release
     */
    public void unlock(String token) {
        this.unlock(token, null);
    }

    /**
     *
     * @param token  token to release
     * @param target scope to inform about the lock
     */
    public void unlock(String token, BroadcastTarget target) {
        String audience = getAudienceToLock(target);
        mutexSingleton.unlock(token, audience);
        if (lockedToken.containsKey(token)) {
            List<String> audiences = lockedToken.get(token);
            audiences.remove(getEffectiveAudience(audience));
            if (audiences.isEmpty()) {
                lockedToken.remove(token);
            }
        }
    }

    public Collection<String> getTokensByAudiences(List<String> audiences) {
        return mutexSingleton.getTokensByAudiences(audiences);
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

        RequestManager.logger.info("Request [" + this.requestId + "] \""
                + this.getMethod() + " " + this.getPath() + "\"" + " for " + info
                + " processed in " + totalDuration + " ms ("
                + " processing: " + processingDuration + "; "
                + " management: " + managementDuration + "; "
                + " propagation: " + propagationDuration + "; "
                + " serialisation: " + serialisationDuration
                + ") => " + this.status);
    }

    /**
     * Lifecycle
     */
    @PostConstruct
    public void postConstruct() {
        this.markProcessingStartTime();
    }

    @PreDestroy
    public void preDestroy() {
        for (Entry<String, List<String>> entry : lockedToken.entrySet()) {
            for (String audience : entry.getValue()) {
                mutexSingleton.unlockFull(entry.getKey(), audience);
            }
        }
        if (this.currentScriptContext != null) {
            this.currentScriptContext.getBindings(ScriptContext.ENGINE_SCOPE).clear();
            this.currentScriptContext = null;
        }

        this.logRequest();

        //this.getEntityManager().flush();
        this.getEntityManager().clear();
    }

    public void commit(Player player, boolean clear) {
        this.requestFacade.commit(player, clear);
    }

    public void commit(Player player) {
        this.requestFacade.commit(player, true);
    }

    public void commit() {
        this.requestFacade.commit(this.getPlayer(), true);
    }

    /**
     * @param millis
     */
    public void pleaseWait(long millis) {
        if (millis > 0) {
            try {
                TimeUnit.MILLISECONDS.sleep(millis);
            } catch (InterruptedException ex) {
            }
        }
    }

    /**
     * Security
     */
    private String[] split(String permissions) {
        return permissions.split(",");
    }

    public void clearPermissions() {
        log("CLEAR PERMISSIONS", 5);
        log("*********************************************************", 5);
        this.grantedPermissions.clear();
    }

    /**
     * Check if current user has access to type/id entity
     *
     * @param type
     * @param id
     * @param currentPlayer
     * @return true if current user has access to
     */
    private boolean hasPermission(String type, String arg, boolean superPermission) {
        Subject subject = SecurityUtils.getSubject();
        //Make sure to have up to date user
        this.getCurrentUser();

        if (subject.hasRole("Administrator")) {
            return true;
        } else if ("Role".equals(type)) {
            return subject.hasRole(arg);
        } else {
            Long id = Long.parseLong(arg);
            if ("GameModel".equals(type)) {

                if (superPermission) {
                    return subject.isPermitted("GameModel:Edit:gm" + id);
                } else {
                    if (subject.hasRole("Trainer") && subject.isPermitted("GameModel:Instantiate:gm" + id)) {
                        //For trainer, instantiate means read
                        return true;
                    }
                    return subject.isPermitted("GameModel:View:gm" + id);
                }
            } else if ("Game".equals(type)) {
                Game game = gameFacade.find(id);
                if (superPermission) {
                    return game != null && SecurityHelper.isPermitted(game, "Edit");
                } else {
                    return game != null && SecurityHelper.isPermitted(game, "View");
                }
            } else if ("Team".equals(type)) {

                Team team = teamFacade.find(id);

                // Current logged User is linked to a player who's member of the team or current user has edit right one the game
                return currentUser != null && team != null && (playerFacade.checkExistingPlayerInTeam(team.getId(), currentUser.getId()) != null || SecurityHelper.isPermitted(team.getGame(), "Edit"));
            } else if ("Player".equals(type)) {
                Player player = playerFacade.find(id);

                // Current player belongs to current user || current user is the teacher or scenarist (test user)
                return player != null && ((currentUser != null && currentUser.equals(player.getUser())) || SecurityHelper.isPermitted(player.getGame(), "Edit"));
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
     * @param channel
     * @return true if access granted
     */
    public boolean hasPermission(String channel) {
        if (channel != null) {
            // remove "private-" from channel name if exists
            channel = channel.replaceFirst("private-", "");

            if (grantedPermissions.contains(channel)) {
                log(" WAS ALREADY GRANTED", 5);
                return true;
            } else {

                boolean superPermission = false;

                if (channel.startsWith("W-")) {
                    channel = channel.replaceFirst("W-", "");
                    superPermission = true;
                }

                String[] split = channel.split("-");

                if (split.length == 2) {
                    if (hasPermission(split[0], split[1], superPermission)) {
                        log(" >>> GRANT: " + channel, 5);
                        grantedPermissions.add(channel);
                    }
                }
                return grantedPermissions.contains(channel);
            }
        } else {
            log(" EMPTYCHANNEL", 5);
            return true;
        }
    }

    private boolean userHasPermission(String permissions, String type, AbstractEntity entity) {
        if (permissions != null) {
            String perms[] = this.split(permissions);
            for (String perm : perms) {
                if (this.hasPermission(perm)) {
                    return true;
                }
            }
            return false;
        }
        log("NO PERMISSIONS REQUIERED", 5);
        return true;
    }

    private void assertUserHasPermission(String permissions, String type, AbstractEntity entity) {
        log("HAS  PERMISSION: " + type + " / " + permissions + " / " + entity, 5);
        logIndent++;
        if (!userHasPermission(permissions, type, entity)) {
            String msg = type + " Permission Denied (" + permissions + ") for user " + this.getCurrentUser() + " on entity " + entity;
            Helper.printWegasStackTrace(new Exception(msg));
            log(msg, 5);
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

}
