/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
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
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
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
import com.wegas.core.security.util.ActAsPlayer;
import com.wegas.core.security.util.ScriptExecutionContext;
import com.wegas.core.security.util.Sudoer;
import com.wegas.core.security.util.WegasEntityPermission;
import com.wegas.core.security.util.WegasIsTeamMate;
import com.wegas.core.security.util.WegasIsTrainerForUser;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Deque;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Map.Entry;
import java.util.ResourceBundle;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.inject.Named;
import javax.naming.NamingException;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.TypedQuery;
import javax.script.ScriptContext;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Response;
import jdk.nashorn.api.scripting.ScriptUtils;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.UnavailableSecurityManagerException;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.mgt.DefaultSecurityManager;
import org.apache.shiro.realm.Realm;
import org.apache.shiro.subject.SimplePrincipalCollection;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.util.ThreadContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.event.Level;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 * @author maxence
 */
@Named("RequestManager")
@RequestScoped
public class RequestManager implements RequestManagerI {

    /**
     * The Wegas Persistence Unit
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     * give access to the entity manager
     *
     * @return the wegas entity manager
     */
    public EntityManager getEntityManager() {
        return em;
    }

    /**
     * Execution environment may be
     * <ul>
     * <li>{@link RequestEnvironment#STD}</li>
     * <li>{@link RequestEnvironment#TEST}</li>
     * <li>{@link RequestEnvironment#INTERNAL}</li>
     * </ul>
     */
    public enum RequestEnvironment {
        /**
         * Standard request from standard client (ie a browser)
         */
        STD,
        /**
         * Testing Request from standard client
         */
        TEST,
        /**
         * Internal Process (timer, etc)
         */
        INTERNAL
    }

    /**
     * What kind of script is being executed
     */
    public enum RequestContext {
        EXTERNAL,
        INTERNAL_SCRIPT
    }

    /*
    @Resource
    private TransactionSynchronizationRegistry txReg;
     */
    @Inject
    private ConcurrentHelper concurrentHelper;

    /**
     * GameModelFacde instance
     */
    @Inject
    private GameModelFacade gameModelFacade;

    /**
     * GameFacade instance
     */
    @Inject
    private GameFacade gameFacade;

    /**
     * Team facade instance
     */
    @Inject
    private TeamFacade teamFacade;

    /**
     * PlayerFacade instance
     */
    @Inject
    private PlayerFacade playerFacade;

    /**
     * UserFacadeInstance.
     */
    @Inject
    private UserFacade userFacade;

    /**
     * AccountFacade instance
     */
    @Inject
    private AccountFacade accountFacade;

    @Inject
    private HttpServletRequest request;

    /**
     * RequestFacade instance
     */
    @Inject
    private RequestFacade requestFacade;

    @Inject
    private WebsocketFacade websocketFacade;

    @Inject
    private JPACacheHelper jpaCacheHelper;

    /**
     * SL4j Logger
     */
    private static Logger logger = LoggerFactory.getLogger(RequestManager.class);

    /**
     * Default request env is {@link RequestEnvironment#STD}
     */
    private RequestEnvironment env = RequestEnvironment.STD;

    private RequestContext currentContext = RequestContext.EXTERNAL;

    /**
     * Default view is {@link Views.Public}
     */
    private Class view = Views.Public.class;

    /**
     * Indicates whether the currentUser is a degraded admin
     * <p>
     * A degraded admin is an admin who execute request as a specific player. In that case, admin
     * rights are degraded to players'trainer ones.
     */
    private boolean wasAdmin = false;

    private ActAsPlayer actAsPlayer;

    /**
     * The current player
     */
    private Player currentPlayer;

    /**
     * The current team
     */
    private Team currentTeam;

    /**
     * The current user
     */
    private User currentUser;
    /**
     * Current shiro principal (i.e. accountId)
     */
    private Long currentPrincipal;

    private Deque<Subject> previousSubjects = new LinkedList<>();

    /**
     * Request identifier
     */
    private String requestId;

    /**
     * Websocket socket id
     */
    private String socketId;

    /**
     * Current HTTP method
     */
    private String method;

    /**
     * HTTP request Path
     */
    private String path;

    /**
     * start timestamp
     */
    private Long startTimestamp;

    /**
     * time entering ManagedMode filter
     */
    private Long managementStartTime;

    /**
     * time leaving managed mode
     */
    private Long serialisationStartTime;

    /**
     * timestamp just before websocket propagation
     */
    private Long propagationStartTime;
    /**
     * timestamp just after websocket propagation
     */
    private Long propagationEndTime;

    /**
     * Request response HTTP code
     */
    private Response.StatusType status;

    /**
     * To count exceptions
     */
    private Long exceptionCounter = 0L;

    /**
     * List of all updated gameModelContent
     */
    private List<GameModelContent> updatedGameModelContent = new ArrayList<>();

    /**
     * Contains all updated entities
     */
    private Set<AbstractEntity> updatedEntities = new HashSet<>();

    /**
     * List of entities which have been deleted during the request
     */
    private Set<AbstractEntity> destroyedEntities = new HashSet<>();

    /**
     * Contains all permission already granted to the current user during the request
     */
    private Collection<WegasPermission> grantedPermissions = new HashSet<>();

    /**
     * List of shiro permissions current user has at the begining of the request
     */
    private Collection<String> effectiveDBPermissions;

    /**
     * List of shiro permissions current user has at the begining of the request
     */
    private Collection<String> degradedDBPermissions;

    /**
     * List of roles current user is member of
     */
    private Collection<String> effectiveRoles;

    /**
     * Map TOKEN -> Audience
     */
    private final Map<String, List<String>> lockedToken = new HashMap<>();

    /**
     * event to propagate to request client
     */
    private List<ClientEvent> events = new ArrayList<>();

    /**
     * the current locale
     */
    private Locale locale;

    /**
     * the Nashorn script context to use during the request
     */
    private ScriptContext currentScriptContext = null;

    private boolean clearCacheOnDestroy = false;

    /**
     * Internal value to pretty print logs
     */
    private static int logIndent = 0;

    /**
     * Internal method to pretty print logs. Call logger.trace(msg), but add whitespaces at the
     * begining of the line, according to current logLevel
     *
     * @param msg  message to display
     * @param args message arguments
     */
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

    /**
     * To count how many events have been thrown and how many have bean consumed
     */
    private final StateMachineEventCounter eventCounter = new StateMachineEventCounter();

    @Override
    public String getBaseUrl() {
        HttpServletRequest req = (HttpServletRequest) request;
        return req.getRequestURL().toString().replace(req.getRequestURI(), req.getContextPath());
    }

    /**
     * Get the current execution environment
     *
     * @return current script execution env
     */
    public RequestEnvironment getEnv() {
        return env;
    }

    /**
     * Change the current execution env
     *
     * @param env new environment to use
     */
    public void setEnv(RequestEnvironment env) {
        this.env = env;
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public boolean isTestEnv() {
        return this.env == RequestEnvironment.TEST;
    }

    /**
     * Get the current script context
     *
     * @return current script context
     */
    public RequestContext getCurrentContext() {
        return currentContext;
    }

    /**
     * Change the script context
     *
     * @param currentContext new script context
     */
    public void setCurrentContext(RequestContext currentContext) {
        this.currentContext = currentContext;
    }

    public ScriptExecutionContext switchToInternalExecContext(boolean doFLush) {
        return new ScriptExecutionContext(this, RequestManager.RequestContext.INTERNAL_SCRIPT, doFLush);
    }

    public ScriptExecutionContext switchToExternalExecContext(boolean doFLush) {
        return new ScriptExecutionContext(this, RequestManager.RequestContext.EXTERNAL, doFLush);
    }

    /**
     * Register entities as updatedEntities
     *
     * @param entities entities to register
     */
    public void addUpdatedEntities(Set<AbstractEntity> entities) {
        this.addEntities(entities, updatedEntities);
    }

    public void addUpdatedEntity(AbstractEntity entity) {
        this.addEntity(entity, updatedEntities);
    }

    /**
     * Register entities as destroyed entities
     *
     * @param entities the entities which have been destroyed
     */
    public void addDestroyedEntities(Set<AbstractEntity> entities) {
        this.addEntities(entities, destroyedEntities);
    }

    /**
     *
     * Register an entity as destroyed entity
     *
     * @param entity the entity which have been destroyed
     */
    public void addDestroyedEntity(AbstractEntity entity) {
        this.addEntity(entity, destroyedEntities);
    }

    /**
     * Add entities to the container.
     *
     * @param entities  entities list mapped by their audience
     * @param container entities destination
     */
    private void addEntities(Set<AbstractEntity> entities, Set<AbstractEntity> container) {
        if (entities != null) {
            for (AbstractEntity entity : entities) {
                this.addEntity(entity, container);
            }
        }
    }

    /**
     * remove entity from the container
     *
     * @param container the container to remove the entity from
     * @param entity    entity to remove
     */
    private void removeEntityFromContainer(Set<AbstractEntity> container, AbstractEntity entity) {
        if (container.contains(entity)) {
            logger.debug("remove {}", entity);
            container.remove(entity);
        }
    }

    /**
     * Add entity within container, mapping entity with audience.
     * <b>GENUINE HACK INSIDE</b>. make sure entity in not in both updated and destroyed containers:
     * <ul>
     * <li>When registering entity as a destroyed one, this method ensure entity is not registered
     * as an updated one by removing it from updatedEntities container.</li>
     * <li>This method don't do anything when registering an entity within updated container if this
     * entity has already been registered in the destroyed one</li>
     * </ul>
     *
     * @param entity    the entity to register
     * @param container the container to register the entity in
     */
    public void addEntity(AbstractEntity entity, Set<AbstractEntity> container) {

        boolean add = true;
        if (container == destroyedEntities) {
            removeEntityFromContainer(updatedEntities, entity);
        } else if (container == updatedEntities && destroyedEntities.contains(entity)) {
            add = false;
        }

        if (add) {
            // make sure to add up to date entity
            if (container.contains(entity)) {
                container.remove(entity);
            }
            container.add(entity);
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
     * Get the currentUser, based one the shiro login state. If shiro current principal does not
     * equals {@link #currentPrincipal}, reset all transient permissions
     *
     * @return the user which is currently logged in
     */
    @Override
    public User getCurrentUser() {
        if (this.currentUser == null || currentPrincipal == null) {
            final Subject subject = SecurityUtils.getSubject();
            Long principal = (Long) subject.getPrincipal();
            this.clearPermissions();
            try {
                if (Helper.isLoggedIn(subject)) {
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
            } catch (NullPointerException npe) {// NOPMD We don't know where NPE came from.
                logger.warn("NPE in getCurrnetUser()");
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

    public ActAsPlayer actAsPlayer(Player player) {
        if (actAsPlayer != null) {
            if (actAsPlayer.getPlayer().equals(player)) {
                actAsPlayer.inc();
            } else {
                throw WegasErrorMessage.error("One should not nest actAsPlayer");
            }
        } else {
            this.actAsPlayer = new ActAsPlayer(this, player);
        }
        return actAsPlayer;
    }

    public void releaseActAsPlayer() {
        this.actAsPlayer = null;
    }

    /**
     * Set the currentPlayer. Reset the {@link #currentScriptContext} if the new currentPlayer is
     * null or if it doesn't equal the previous one
     *
     * @param currentPlayer the currentPlayer to set
     */
    public void setPlayer(Player currentPlayer) {
        if (this.currentPlayer == null || !this.currentPlayer.equals(currentPlayer)) {
            this.setCurrentScriptContext(null);
        }
        this.currentPlayer = currentPlayer != null ? (currentPlayer.getId() != null ? playerFacade.find(currentPlayer.getId()) : currentPlayer) : null;

        /*
         * When running requests as a player, one should never have more permissions than it needs
         * Hence, we have to degrade permission to keep only those that are relevant to the player context
         */
        if (currentPlayer != null) {
            if (wasAdmin || hasRole("Administrator")) {
                // currentUser is an administrator
                // drop all permissions and grant game model edit right only
                this.wasAdmin = true;
                Collection<String> roles = this.getEffectiveRoles();
                roles.remove("Administrator");
                if (!roles.contains("Scenarist")) {
                    roles.add("Scenarist");
                }
                if (!roles.contains("Trainer")) {
                    roles.add("Trainer");
                }
                //WegasPermission gmWriteRight = currentPlayer.getGameModel().getAssociatedWritePermission();
                HashSet<String> degradedPerms = new HashSet<>();
                degradedPerms.add("GameModel:*:gm" + currentPlayer.getGameModelId());
                degradedPerms.add("Game:*:g" + currentPlayer.getGameId());

                WegasPermission gmPerm = currentPlayer.getGameModel().getAssociatedWritePermission();
                WegasPermission gPerm = currentPlayer.getGame().getAssociatedWritePermission();

                // set & clear permissions in one shot:
                this.degradedDBPermissions = degradedPerms;
                this.grantedPermissions.clear();

                this.grant(gmPerm);
                this.grant(gPerm);
            } else {
                // filter effective DBpermissions

                // currentUser is not an administrator
                // filter all permission but ones related to the player context
                String gId = "g" + currentPlayer.getGame().getId();
                String gmId = "gm" + currentPlayer.getGameModel().getId();

                if (this.effectiveDBPermissions == null) {
                    this.degradedDBPermissions = null;
                    getEffectiveDBPermissions();
                }
                // set & clear permissions in one shot:
                this.degradedDBPermissions = this.effectiveDBPermissions.stream().filter(p -> {
                    return p.endsWith(gId) || p.endsWith(gmId);
                }).collect(Collectors.toSet());
                this.grantedPermissions.clear();
            }
            // And make sure to set the current team
            this.setCurrentTeam(currentPlayer.getTeam());
            this.assertUpdateRight(currentPlayer);
        } else {
            this.setCurrentTeam(null);

            // do not degrade permission any longer
            if (this.degradedDBPermissions != null) {
                this.degradedDBPermissions.clear();
                this.degradedDBPermissions = null;
            }

            if (this.wasAdmin) {
                // give admin membership back
                this.wasAdmin = false;
                this.getEffectiveRoles().add("Administrator");
            }
        }
    }

    /**
     * Get the current team. When a currentPlayer is available, the currentTeam always equals the
     * currentPlayer.getTeam().
     * <p>
     * There is at least one case a currentTeam is set without any currentPlayer : on team creation
     *
     * @return
     */
    public Team getCurrentTeam() {
        return this.currentTeam;
    }

    /**
     * set the current team.
     *
     * @param team
     */
    public void setCurrentTeam(Team team) {
        if (team != null) {
            User user = getCurrentUser();

            // if currentPlayer is set, make sure it is member of the new current team.
            // set to null otherwise
            if (currentPlayer != null && !team.equals(currentPlayer.getTeam())) {
                // current player is not a member of the current team
                this.setPlayer(null);
                // warning: setPlayer(null) will also set currentTeam to null
            }

            // if no current user, try to find one
            if (currentPlayer == null) {
                Player newPlayer = playerFacade.findPlayerInTeam(team.getId(), user.getId());
                this.setPlayer(newPlayer);
            }

        }
        this.currentTeam = team;

        if (this.currentTeam != null) {
            // if current Team is defined, make sure current user has edit right
            this.assertUpdateRight(team);
        }
    }

    /**
     * Get the gameModel linked to the current player
     *
     * @return gameModel linked to the current player
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

    /**
     * The state machine eventCounter
     *
     * @return the state machine event counter
     */
    public StateMachineEventCounter getEventCounter() {
        return eventCounter;
    }

    /**
     * Clear all entity containers
     */
    public void clearEntities() {
        this.clearUpdatedEntities();
        this.clearDestroyedEntities();
    }

    /**
     * clear the updatedEntities container
     */
    public void clearUpdatedEntities() {
        this.updatedEntities.clear();
    }

    private void removeAll(Map<String, List<AbstractEntity>> container,
        Map<String, List<AbstractEntity>> toRemove) {
        if (toRemove != null) {
            for (Entry<String, List<AbstractEntity>> entry : toRemove.entrySet()) {
                String audience = entry.getKey();

                List<AbstractEntity> get = container.get(audience);

                if (get != null) {
                    get.removeAll(entry.getValue());
                }
            }
        }
    }

    private void addAll(Map<String, List<AbstractEntity>> container,
        Map<String, List<AbstractEntity>> toAdd) {
        if (toAdd != null) {
            for (Entry<String, List<AbstractEntity>> entry : toAdd.entrySet()) {
                String audience = entry.getKey();
                if (!container.containsKey(audience)) {
                    container.put(audience, new LinkedList<>());
                }
                container.get(audience).addAll(entry.getValue());
            }
        }
    }

    public Map<String, List<AbstractEntity>> getMappedUpdatedEntities() {
        Map<String, List<AbstractEntity>> map = new HashMap<>();

        for (AbstractEntity entity : updatedEntities) {
            if (entity instanceof Broadcastable) {
                addAll(map, ((Broadcastable) entity).getEntities());
            }
        }

        for (AbstractEntity entity : destroyedEntities) {
            if (entity instanceof Broadcastable && (entity instanceof VariableDescriptor
                || entity instanceof VariableInstance
                || entity instanceof GameModel
                || entity instanceof Game
                || entity instanceof Player
                || entity instanceof Team)) {
                removeAll(map, ((Broadcastable) entity).getEntities());
            }
        }
        return map;
    }

    public Map<String, List<AbstractEntity>> getMappedDestroyedEntities() {
        Map<String, List<AbstractEntity>> map = new HashMap<>();

        for (AbstractEntity entity : destroyedEntities) {
            if (entity instanceof Broadcastable
                && (entity instanceof VariableDescriptor
                || entity instanceof VariableInstance
                || entity instanceof Game
                || entity instanceof GameModel)) {
                addAll(map, ((Broadcastable) entity).getEntities());
            }
        }
        return map;
    }

    /**
     * @return entities which have just been updated
     */
    public Set<AbstractEntity> getUpdatedEntities() {
        return updatedEntities;
    }

    public void addUpdatedGameModelContent(GameModelContent gmContent) {
        if (gmContent != null && !updatedGameModelContent.contains(gmContent)) {
            updatedGameModelContent.add(gmContent);
        }
    }

    public List<GameModelContent> getUpdatedGameModelContent() {
        return updatedGameModelContent;
    }

    /**
     * clear the destroyedEntities container.
     */
    public void clearDestroyedEntities() {
        this.destroyedEntities.clear();
    }

    /**
     * Get the destroyedEntites container.
     *
     * @return the destroyedEntites container
     */
    public Set<AbstractEntity> getDestroyedEntities() {
        return destroyedEntities;
    }

    /**
     * Get the list of event to send to client
     *
     * @return list of client events
     */
    public List<ClientEvent> getClientEvents() {
        return events;
    }

    /**
     * Register a client event, such a popup
     *
     * @param event
     */
    public void addEvent(ClientEvent event) {
        this.events.add(event);
    }

    /**
     * Register an exception to return to the client
     *
     * @param e exception to send to client
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
            this.addEvent(new CustomEvent(type, ScriptUtils.wrap(payload)));
        } else {
            this.addEvent(new CustomEvent(type, payload));
        }
    }

    @Override
    public void sendNotification(Object payload) {
        this.sendCustomEvent("notificationEvent", payload);
    }

    /**
     * how many exception have been registered ? it number of event within {@link #events} which are
     * instanceof ExceptionEvent
     *
     * @return exception count
     */
    public Long getExceptionCounter() {
        return exceptionCounter;
    }

    /**
     * Set exception count
     *
     * @param exceptionCounter
     */
    public void setExceptionCounter(Long exceptionCounter) {
        this.exceptionCounter = exceptionCounter;
    }

    /**
     * Get the requested JSON view to serialise response with
     *
     * @return the view
     */
    public Class getView() {
        return view;
    }

    /**
     * Set to JSON view to use when serialising the response
     *
     * @param view the view to set
     */
    public void setView(Class view) {
        this.view = view;
    }

    public boolean isEditorView(){
        return Views.EditorI.class.isAssignableFrom(this.view);
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
     * @return the locale
     */
    @Override
    public Locale getLocale() {
        return locale;
    }

    /**
     * @param locale the locale to set
     */
    @Override
    public void setLocale(Locale locale) {
        this.locale = locale;
    }

    /**
     * Based on target, return the audience (i.e. websocket channel) to lock
     *
     * @param target instanceOwner to get the audience from
     *
     * @return the audience to lock
     *
     * @throws WegasErrorMessage if currentUser don't have the right to lock the target
     */
    private String getAudienceToLock(InstanceOwner target) {
        if (target != null) {
            if (this.hasPermission(target.getAssociatedReadPermission())) {
                return target.getChannel();
            } else {
                throw WegasErrorMessage.error("You don't have the right to lock " + target);
            }
        }
        return null;
    }

    /**
     * Return effective audience to use. It means using "internal" if the given audien is null or
     * empty
     *
     * @param audience audience
     *
     * @return audience or "internal" if audience is null
     */
    private String getEffectiveAudience(String audience) {
        if (audience != null && !audience.isEmpty()) {
            return audience;
        } else {
            return "internal";
        }
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public boolean tryLock(String token) {
        return tryLock(token, null);
    }

    /**
     * {@inheritDoc }
     */
    public boolean tryLock(String token, InstanceOwner target) {
        String audience = getAudienceToLock(target);
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
     * @param token token to lock
     */
    @Override
    public void lock(String token) {
        this.lock(token, null);
    }

    /**
     * remember token is locked for audience.
     *
     * @param token    locked token
     * @param audience audience for which the token is locked
     */
    private void registerLocalLock(String token, String audience) {
        String effectiveAudience = getEffectiveAudience(audience);
        logger.debug("Register Local Lock: {} -> {}", token, effectiveAudience);
        lockedToken.get(token).add(effectiveAudience);
    }

    /**
     * @param token  token to lock
     * @param target scope to inform about the lock
     */
    @Override
    public void lock(String token, InstanceOwner target) {
        String audience = getAudienceToLock(target);
        logger.debug("LOCK \"{}\" for \"{}\"", token, audience);
        concurrentHelper.lock(token, audience);
        if (!lockedToken.containsKey(token)) {
            lockedToken.put(token, new ArrayList());
        }
        this.registerLocalLock(token, audience);
    }

    /**
     * Internal unlock
     *
     * @param token token to release
     */
    @Override
    public void unlock(String token) {
        this.unlock(token, null);
    }

    /**
     * @param token  token to release
     * @param target scope to inform about the lock
     */
    @Override
    public void unlock(String token, InstanceOwner target) {
        String audience = getAudienceToLock(target);
        logger.debug("UNLOCK \"{}\" for \"{}\"", token, audience);
        concurrentHelper.unlock(token, audience, false);
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

    /**
     * get all token locked for all audiences in the list
     *
     * @param audiences list of audiences
     *
     * @return all tokens locked for all audiences
     */
    public Collection<String> getTokensByAudiences(List<String> audiences) {
        return concurrentHelper.getTokensByAudiences(audiences);
    }

    /**
     * Change http status
     *
     * @param statusInfo new status
     */
    public void setStatus(Response.StatusType statusInfo) {
        this.status = statusInfo;
    }

    /*
     * Set {@link #startTimestamp} to now
     */
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

        String info = "[u:" + (currentUser != null ? currentUser.getId() : "anonymous") + "::p:"
            + (currentPlayer != null ? currentPlayer.getId() : "n/a") + "::t:"
            + (currentTeam != null ? currentTeam.getId() : "n/a") + "]";

        Level level = Level.INFO;
        if (this.status != null && this.status.getStatusCode() >= 400) {
            level = Level.ERROR;
        }
        if (requestId == null) {
            Helper.log(logger, level, "Internal Request for {} processed in {} ms ", info, totalDuration);
        } else {
            Helper.log(logger, level,
                "Request [{}] \"{} {}\" for {} processed in {} ms ( processing: {}; management: {}, propagation: {}, serialisation: {}) => {}",
                this.requestId, this.getMethod(), this.getPath(), info,
                totalDuration, processingDuration, managementDuration, propagationDuration, serialisationDuration,
                this.status);
        }
    }

    /**
     * Lifecycle callback to mark the processing start time
     */
    @PostConstruct
    public void postConstruct() {
        this.markProcessingStartTime();
    }

    /**
     * Clear the entityManager
     */
    public void clear() {
        this.getEntityManager().clear();
    }

    /**
     * flush all pending changes in db
     */
    public void flush() {
        this.getEntityManager().flush();
    }

    /**
     *
     */
    public void flushAndClearCaches() {
        // flush all changes in db, but do not update the 2nd level cache
        this.getEntityManager().flush();
        // clear the first level cache
        this.getEntityManager().clear();

        /**
         * At this point, just flushed entities are outdated in the 2nd level cache We MUST evict
         * them all
         */
        jpaCacheHelper.evictUpdatedEntitiesLocalOnly();

        /**
         * Moreover, cache synchronisation will fail and others instances 2nd level cache will be
         * outdated too Ask to requestManager to clear them too at the end of the request
         */
        this.pleaseClearCacheAtCompletion();
    }

    private void pleaseClearCacheAtCompletion() {
        this.clearCacheOnDestroy = true;
    }

    /**
     * Lifecycle callback. Release all locks after the request and log the request summary
     */
    @PreDestroy
    public void preDestroy() {
        this.clearPermissions();
        for (Entry<String, List<String>> entry : lockedToken.entrySet()) {
            logger.debug("PreDestroy Unlock: key: {}", entry.getKey());
            for (String audience : entry.getValue()) {
                logger.debug("->ConcurrentHelper unlockFull for {}", audience);
                concurrentHelper.unlockFull(entry.getKey(), audience, false);
            }
        }

        if (currentUser != null) {
            websocketFacade.touchOnlineUser(currentUser.getId(),
                currentPlayer != null ? currentPlayer.getId() : null);
        }

        if (this.currentScriptContext != null) {
            this.currentScriptContext.getBindings(ScriptContext.ENGINE_SCOPE).clear();
            this.currentScriptContext = null;
        }

        this.logRequest();

        //this.getEntityManager().flush();
        if (clearCacheOnDestroy) {
            // ask each instances to clear 2nd level cache
            jpaCacheHelper.evictUpdatedEntities();
        }

        this.clear();
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public void commit(Player player) {
        this.requestFacade.commit(player);
    }

    /**
     * {@inheritDoc}
     */
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

    /*
     ---------------------------------------------------------------------------
     | Security
     ---------------------------------------------------------------------------
     */
    /**
     * Clear all granted wegas permissions and clear effective roles/DBPermissions
     */
    public void clearPermissions() {
        log("CLEAR PERMISSIONS");
        log("*********************************************************");
        this.grantedPermissions.clear();
        this.clearEffectivePermisssions();
    }

    public void logout() {
        this.logout(SecurityUtils.getSubject());
    }

    public void logout(Subject subject) {
        subject.logout();
        this.setPlayer(null);
        this.clearCurrents();
    }

    public void clearCurrents() {
        this.currentUser = null;
        this.currentPrincipal = null;
        this.clearPermissions();
    }

    /**
     * Used to clear permission when changing the currentUser
     */
    public void clearEffectivePermisssions() {

        if (this.effectiveRoles != null) {
            this.effectiveRoles.clear();
            this.effectiveRoles = null;
        }

        if (this.effectiveDBPermissions != null) {
            this.effectiveDBPermissions.clear();
            this.effectiveDBPermissions = null;
        }

        if (this.degradedDBPermissions != null) {
            this.degradedDBPermissions.clear();
            this.degradedDBPermissions = null;
        }
    }

    /**
     * get all role which the currentUser was member before the beginning of this request
     *
     * @return list of role the user is member for sure (fully persisted membership)
     */
    public Collection<String> getEffectiveRoles() {
        if (this.effectiveRoles == null) {
            User user = this.getCurrentUser();
            effectiveRoles = new HashSet<>();
            //for (String p : userFacade.findRolesNative(user)) {
            if (user != null) {
                for (Role p : userFacade.findRolesTransactional(user.getId())) {
                    effectiveRoles.add(p.getName());
                }
            }
        }

        return effectiveRoles;
    }

    /**
     * get all shiro permission which were associated to the currentUser before the beginning of
     * this request
     *
     * @return list of permission the user has for sure (fully persisted ones)
     */
    public Collection<String> getEffectiveDBPermissions() {
        if (this.degradedDBPermissions != null) {
            return degradedDBPermissions;
        } else {
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
    }

    /**
     * {@inheritDoc }
     */
    @Override
    public boolean hasRole(String roleName
    ) {
        return this.getEffectiveRoles().contains(roleName);
    }

    /**
     * Assert shiro permission
     *
     * @param permission
     */
    public void checkPermission(String permission) {
        if (!isPermitted(permission)) {
            throw new WegasAccessDenied(null, null, permission, currentUser);
        }
    }

    /**
     * Replacement method for {@link Subject#isPermitted(java.lang.String)} This method is much
     * faster than shiro one...
     *
     * @param permission
     *
     * @return
     */
    public boolean isPermitted(String permission) {
        String[] pSplit = permission.split(":");

        if (pSplit.length == 3) {
            Collection<String> perms = this.getEffectiveDBPermissions();

            for (String p : perms) {
                String[] split = p.split(":");
                if (split.length == 3
                    // todo: Not so happy with those "contains" -> DO a f*ckin good regex to handle all cases
                    && split[0].equals(pSplit[0])
                    && (split[1].equals("*") || split[1].contains(pSplit[1]))
                    && (split[2].equals("*") || split[2].equals(pSplit[2]))) {
                    return true;

                }
            }
        }
        return false;
    }

    /**
     * Has Current user Shiro Edit permission on gameModel ?
     *
     * @param gameModel the gameModel to check permission against
     *
     * @return true if the user has edit permission on the gameModel
     */
    private boolean hasDirectGameModelEditPermission(GameModel gameModel) {
        return this.isPermitted("GameModel:Edit:gm" + gameModel.getId());
    }

    /**
     * Has Current user Shiro Edit permission on game ?
     *
     * @param game the game to check permission against
     *
     * @return true if the user has edit permission on the game
     */
    private boolean hasDirectGameEditPermission(Game game) {
        return this.isPermitted("Game:Edit:g" + game.getId());
    }

    /**
     * Check if the currentUser has permission to read or write the given game.
     * <p>
     * A superPermission (write) is permitted if <ul>
     * <li>user has super-permission on its gameModel</li>
     * <li>OR the game is not yet persisted</li>
     * <li>OR shiro EDIT permission on the game is permitted</li>
     * </ul>
     * <p/>
     * A "normal" (readonly) permission is permitted if <ul>
     * <li>any of the superPermission condition</li>
     * <li>OR the game is a DebugGame and user has permission on its GameModel</li>
     * <li>OR the game is OPEN</li>
     * <li>OR user owns a player in the game</li>
     * </ul>
     *
     * @param game            the game to check permission against
     * @param superPermission true means scenarist/trainer right
     *
     * @return true if permitted
     */
    private boolean hasGamePermission(Game game, boolean superPermission) {

        if (game instanceof DebugGame) {
            // when checked against a DebugGame, must have scenarist rights
            if (superPermission) {
                return this.hasGameModelPermission(game.getGameModel(), (WegasEntityPermission) game.getGameModel().getAssociatedWritePermission());
            } else {
                return this.hasGameModelPermission(game.getGameModel(), (WegasEntityPermission) game.getGameModel().getAssociatedReadPermission());
            }
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

    /**
     * Check if the currentUser has permission to read or write the given gameModel. A
     * superPermission (write) is permitted if <ul>
     * <li>The game model is not yet persisted</li>
     * <li>OR shiro EDIT permission on the gameModel is permitted</li>
     * <li>OR the gameModel is a {@link GameModel.Status#PLAY} one and currentUser has
     * superPermission on the underlying game</li>
     * </ul>
     * <p/>
     * A "normal" (readonly) permission is permitted if <ul>
     * <li>any of the superPermission condition</li>
     * <li>OR the gameModel is a {@link GameModel.Status#PLAY} one and currentUser has read on the
     * underlying game</li>
     * <li>OR the currentUser is a trainer/scenarist and has shiro Instantiate or Duplicate
     * permission</li>
     * <li>OR the currentUser has shiro View permission</li>
     * </ul>
     *
     * @param gameModel       the gameModel to check permission against
     * @param superPermission true means trainer/scenarist right
     *
     * @return true if permitted
     */
    private boolean hasGameModelPermission(GameModel gameModel, WegasEntityPermission thePerm) {
        if (!(gameModel.isPersisted() || gameModelFacade.isPersisted(gameModel.getId())) // not yet persisted means the gameModel is being created right kown
            || hasDirectGameModelEditPermission(gameModel)) {
            return true;
        } else if (gameModel.isReference() && hasGameModelPermission(gameModel.getBasedOn(), thePerm)) {
            return true;
        } else if (gameModel.isPlay()) {
            /**
             * GameModel permission against a "PLAY" gameModel.
             */
            for (Game game : gameModel.getGames()) {
                // has permission to at least on game of the game model ?
                if (game instanceof DebugGame == false
                    && // very old gamemodel owns several games : in this case ignore debug one
                    this.hasGamePermission(game, (thePerm.getLevel() != WegasEntityPermission.Level.READ))) {
                    return true;
                }
            }
            return false;
        } else {
            /**
             * GameModel permission against a true gameModel.
             */
            long id = gameModel.getId();
            if (thePerm.getLevel() == WegasEntityPermission.Level.READ) {
                if ((this.hasRole("Trainer") || this.hasRole("Scenarist"))
                    && (this.isPermitted("GameModel:Instantiate:gm" + id)
                    || this.isPermitted("GameModel:Duplicate:gm" + id)
                    || this.isPermitted("GameModel:Translate-:gm" + id))) {
                    //For scenarist and trainer, instantiate and duplicate means read
                    return true;
                }
                // fallback: View means View
                return this.isPermitted("GameModel:View:gm" + id);
            } else if (thePerm.getLevel() == WegasEntityPermission.Level.TRANSLATE) {
                if ((this.hasRole("Trainer") || this.hasRole("Scenarist"))
                    && (this.isPermitted("GameModel:Translate-" + thePerm.getPayload() + ":gm" + id))) {
                    return true;
                }
                return false;
            } else {
                return false;
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
    private boolean hasEntityPermission(WegasEntityPermission perm) {
        getCurrentUser();
        switch (perm.getType()) {
            case GAMEMODEL:
                GameModel gameModel = gameModelFacade.find(perm.getId());
                return this.hasGameModelPermission(gameModel, perm);
            case GAME:
                Game game = gameFacade.find(perm.getId());
                return this.hasGamePermission(game, perm.getLevel() == WegasEntityPermission.Level.WRITE)
                    || this.hasGameModelTranslateRight(game.getGameModel());
            case TEAM:
                Team team = teamFacade.find(perm.getId());
                return team != null && ((currentUser != null && (playerFacade.isInTeam(team.getId(), currentUser.getId()) // Current logged User is linked to a player who's member of the team
                    || currentUser.equals(team.getCreatedBy()) // or current user is the team creator
                    )
                    || this.hasGamePermission(team.getGame(), perm.getLevel() == WegasEntityPermission.Level.WRITE)) // or read (or write for superP) right one the game
                    || this.hasGameModelTranslateRight(team.getParentGameModel()));
            case PLAYER:
                Player player = playerFacade.find(perm.getId());
                // Current player belongs to current user || current user is the teacher or scenarist (test user)
                return player != null && ((currentUser != null && currentUser.equals(player.getUser()))
                    || this.hasGamePermission(player.getGame(), perm.getLevel() == WegasEntityPermission.Level.WRITE)
                    || this.hasGameModelTranslateRight(player.getGameModel()));
            case USER:
                User find = userFacade.find(perm.getId());
                return currentUser != null && currentUser.equals(find);
            default:
                return false;
        }
    }

    /**
     * Returns {@code true} if currentUser membership to underlying role
     *
     * @param perm membership permission to check
     *
     * @return true if currentuser membership matches
     */
    private boolean isMemberOf(WegasMembership perm) {
        return this.hasRole(perm.getName());
    }

    /**
     * Whether the current user has already been granted a Game Write permission for any game in 
     * which the given user act as player
     *
     * @param userId
     *
     * @return
     */
    private boolean hasAlreadyGrantedGameWritePermissionForUser(Long userId) {
        TypedQuery<Long> query = getEntityManager().createNamedQuery("Player.findGameIds", Long.class);
        query.setParameter("userId", userId);

        return query.getResultList().stream()
            .map(gameId -> Game.getAssociatedWritePermission(gameId))
            .filter(p -> grantedPermissions.contains(p))
            .findFirst().isPresent();
    }

    /**
     *
     * @param wegasIsTeamMate
     *
     * @return
     */
    private boolean isTeamMate(WegasIsTeamMate wegasIsTeamMate) {
        Long mateId = wegasIsTeamMate.getUserId();

        Player self = getPlayer();
        if (getPlayer() != null) {

            if (wasAdmin) {
                // wasAdmin indicates current context is based on degraded permissions
                // in that case, the default Player.IsUserTeamMateOfPlayer will fail
                // a custom check must be done
                return hasAlreadyGrantedGameWritePermissionForUser(wegasIsTeamMate.getUserId());
            }

            Query query = getEntityManager().createNamedQuery("Player.isUserTeamMateOfPlayer");

            query.setParameter(1, self.getId());
            query.setParameter(2, mateId);

            List results = query.getResultList();

            return !results.isEmpty();
        } else {
            logger.error("NO CURRENT PLAYER IN CONTEXT!");
            return false;
        }
    }

    /**
     * Is the given user member of a game leads by the currentUser ?
     *
     * @param perm permission to check
     *
     * @return true is the currentUser has access to the user
     */
    private boolean isTrainerForUser(WegasIsTrainerForUser perm) {
        User self = this.getCurrentUser();
        if (self != null) {
            if (wasAdmin) {
                // wasAdmin indicates current context is based on degraded permissions
                // in that case, the default Player.IsTrainerForUser will fail
                // a custom check must be done
                return hasAlreadyGrantedGameWritePermissionForUser(perm.getUserId());
            }

            Long userId = perm.getUserId();

            Query query = getEntityManager().createNamedQuery("Player.IsTrainerForUser");

            query.setParameter(1, userId);
            query.setParameter(2, self.getId());

            List results = query.getResultList();

            return !results.isEmpty();
        } else {
            return false;
        }
    }

    /**
     * Returns {@code true} if the currentUser owns the permission
     *
     * @param permission permission to check
     *
     * @return true if the currentUser is permitted, false otherwise.
     */
    public boolean hasPermission(WegasPermission permission) {

        if (permission != null) {
            if (grantedPermissions.contains(permission)) {
                log(" WAS ALREADY GRANTED");
                return true;
            } else {

                this.getCurrentUser();
                if ((currentPlayer == null && hasRole("Administrator"))
                    || permission instanceof WegasMembership && this.isMemberOf((WegasMembership) permission)
                    || permission instanceof WegasIsTeamMate && this.isTeamMate((WegasIsTeamMate) permission)
                    || permission instanceof WegasIsTrainerForUser && isTrainerForUser((WegasIsTrainerForUser) permission)
                    || permission instanceof WegasEntityPermission && this.hasEntityPermission((WegasEntityPermission) permission)) {
                    log(" >>> GRANT: {}", permission);
                    this.grant(permission);
                    return true;
                }
                return grantedPermissions.contains(permission);
            }
        } else {
            log(" NULL PERMISSION");
            return true;
        }
    }

    /* package */ public void grant(WegasPermission perm) {
        this.grantedPermissions.add(perm);
    }

    /**
     * check if currentUser has at least one of the permission in permissions.
     *
     * @param permissions list of permissions, null means no permission required, empty list means
     *                    forbidden
     *
     * @return truc if at least one permission from the list is permitted
     */
    public boolean hasAnyPermission(Collection<WegasPermission> permissions) {
        // null means no permission required
        if (permissions != null) {
            /*
             * not null value means at least one permission from the list.
             * Hence, empty string "" means forbidden, even for admin
             */
            for (WegasPermission perm : permissions) {
                if (this.hasPermission(perm)) {
                    return true;
                }
            }
            return false;
        }
        log("NO PERMISSIONS REQUIERED");
        return true;
    }

    /**
     * Assert currentUser has at least one of the permission in permissions.
     *
     * @param permissions list of permissions, null means no permission required, empty list means
     *                    forbidden
     * @param type        some string for logging purpose
     * @param entity      entity permissions are relatred to (logging purpose only)
     *
     * @throws WegasAccessDenied permissions is not null and no permission in permissions is
     *                           permitted
     */
    private void assertUserHasPermission(Collection<WegasPermission> permissions, String type, WithPermission entity) throws WegasAccessDenied {
        log("HAS  PERMISSION: {} / {} / {}", type, permissions, entity);
        logIndent++;
        if (!hasAnyPermission(permissions)) {
            String msg = type + " Permission Denied (" + permissions + ") for user " + this.getCurrentUser() + " on entity " + entity;
            //Helper.printWegasStackTrace(new Exception(msg));
            log(msg);
            throw new WegasAccessDenied(entity, type, msg, this.getCurrentUser());
        }
        logIndent--;
    }

    /**
     * Assert the current user has the required "Create" permission on an entity
     *
     * @param entity the entity to check the permission against
     *
     * @throws WegasAccessDenied currentUser do NOT have the permission
     */
    public void assertCreateRight(WithPermission entity) {
        this.assertUserHasPermission(entity.getRequieredCreatePermission(this.currentContext), "Create", entity);
    }

    /**
     * Assert the current user has the required "read" permission on an entity
     *
     * @param entity the entity to check the permission against
     *
     * @throws WegasAccessDenied currentUser do NOT have the permission
     */
    public void assertReadRight(WithPermission entity) {
        this.assertUserHasPermission(entity.getRequieredReadPermission(this.currentContext), "Read", entity);
    }

    /**
     * Assert the current user has the required "update" permission on an entity
     *
     * @param entity the entity to check the permission against
     *
     * @throws WegasAccessDenied currentUser do NOT have the permission
     */
    public void assertUpdateRight(WithPermission entity) {
        this.assertUserHasPermission(entity.getRequieredUpdatePermission(this.currentContext), "Update", entity);
    }

    /**
     * Assert the current user has the required "delete" permission on an entity
     *
     * @param entity the entity to check the permission against
     *
     * @throws WegasAccessDenied currentUser do NOT have the permission
     */
    public void assertDeleteRight(WithPermission entity) {
        this.assertUserHasPermission(entity.getRequieredDeletePermission(this.getCurrentContext()), "Delete", entity);
    }

    /*
     * Security Sugars
     */
    /**
     * Is the current user an administrator ?
     *
     * @return whether or not the currentUser is an administrator
     */
    public boolean isAdmin() {
        return this.hasRole("Administrator");
    }

    /**
     * Can the currentUser read the given game ?
     *
     * @param game the game the currentUser want to read
     *
     * @return whether or not the currentUser can read the game
     */
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

    /**
     * Can the currentUser read the given gameModel ?
     *
     * @param gameModel the gameModel the currentUser want to read
     *
     * @return whether or not the currentUser can read the gameModel
     */
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

    /**
     * {@inheritDoc }
     */
    @Override
    public boolean hasGameModelTranslateRight(final GameModel gameModel) {
        return this.hasPermission(gameModel.getAssociatedTranslatePermission(""));
    }

    /**
     * Can the currentUser acts as a member of the given team
     *
     * @param team the team the currentUser want to use
     *
     * @return whether or not the currentUser can act as a player from the team
     */
    public boolean hasTeamRight(final Team team) {
        return this.hasPermission(team.getAssociatedWritePermission());
    }

    /**
     * Can the currentUser acts as the given player ?
     *
     * @param player the player the currentUser want to use
     *
     * @return whether or not the currentUser can act as the player
     */
    public boolean hasPlayerRight(final Player player) {
        return this.hasPermission(player.getAssociatedWritePermission());
    }

    /**
     * has the currentUser the right to restore the given gameModel from the bin
     *
     * @param gameModel the game model to restore
     *
     * @return whether or not the user can move gameModel from the bin
     */
    public boolean canRestoreGameModel(final GameModel gameModel) {
        String id = "gm" + gameModel.getId();
        return this.isPermitted("GameModel:View:" + id)
            || this.isPermitted("GameModel:Edit" + id)
            || this.isPermitted("GameModel:Instantiate:" + id)
            || this.isPermitted("GameModel:Duplicate:" + id);
    }

    /**
     * has the currentUser the right to instantiate the given gameModel
     *
     * @param gameModel the game model to instantiate
     *
     * @return whether or not the user can instantiate the gameModel
     */
    public boolean canInstantiateGameModel(final GameModel gameModel) {
        GameModel theOne;
        if (gameModel.isPlay() && gameModel.getBasedOnId() != null) {
            theOne = gameModel.getBasedOn();
        } else {
            theOne = gameModel;
        }
        String id = "gm" + theOne.getId();
        return this.isPermitted("GameModel:Instantiate:" + id);
    }

    /**
     * has the currentUser the right to duplicate the given gameModel
     *
     * @param gameModel the game model to duplicate
     *
     * @return whether or not the user can duplicate gameModel
     */
    public boolean canDuplicateGameModel(final GameModel gameModel) {
        GameModel theOne;
        if (gameModel.isPlay() && gameModel.getBasedOnId() != null) {
            theOne = gameModel.getBasedOn();
        } else {
            theOne = gameModel;
        }
        String id = "gm" + theOne.getId();
        return this.isPermitted("GameModel:Duplicate:" + id);
    }

    /**
     * has the currentUser the right to delete (ie move to BIN, empty from the bin) the given
     * gameModel
     *
     * @param gameModel the gameModel the user want to move to the bin
     *
     * @return whether or not the user can move gameModel to the bin
     */
    public boolean canDeleteGameModel(final GameModel gameModel) {
        String id = "gm" + gameModel.getId();
        return this.isPermitted("GameModel:Delete:" + id);
    }

    /**
     * Has the currentUser the right to listen to a channel
     *
     * @param channel the channel the user want to listen to
     *
     * @return true if the currentUser can listen to the channel
     */
    public boolean hasChannelPermission(String channel) {
        if (channel != null) {
            Pattern p = Pattern.compile("^((presence|private)-)([a-zA-Z]*)-([a-zA-Z0-9]*)$");

            Matcher m = p.matcher(channel);
            if (m.find()) {
                if (m.group(3).equals("Role")) {
                    // e.g. private-Role-Administrator
                    return this.isMemberOf(new WegasMembership(m.group(4)));
                } else {
                    if ("GameModelEditor".equals(m.group(3))) {
                        return this.hasEntityPermission(
                            new WegasEntityPermission(
                                Long.parseLong(m.group(4)),
                                WegasEntityPermission.Level.WRITE,
                                WegasEntityPermission.EntityType.GAMEMODEL));
                    } else {
                        return this.hasEntityPermission(
                            new WegasEntityPermission(
                                Long.parseLong(m.group(4)),
                                WegasEntityPermission.Level.READ,
                                WegasEntityPermission.EntityType.valueOf(m.group(3).toUpperCase())));
                    }
                }
            }
        }
        return false;
    }


    /*
     * Assert the current user have write right on the game

     * @throw WegasAccessDenied
     */
    public void assertGameTrainer(final Game game) {
        if (!hasGameWriteRight(game)) {
            throw new WegasAccessDenied(game, "Trainer", game.getRequieredUpdatePermission(this.currentContext).toString(), this.getCurrentUser());
        }
    }

    /**
     * Assert the current user have read right on the game model
     *
     * @param gameModel gameModel to check right against
     *
     * @throw WegasAccessDenied
     */
    public void assertCanReadGameModel(final GameModel gameModel) {
        if (!hasGameModelReadRight(gameModel)) {
            throw new WegasAccessDenied(gameModel, "Read", gameModel.getRequieredReadPermission(this.currentContext).toString(), this.getCurrentUser());
        }
    }

    /**
     * Assert currentUser has the right to instantiate gameModel
     *
     * @param gameModel the GameModel to check right against
     */
    public void assertCanInstantiateGameModel(final GameModel gameModel) {
        if (!canInstantiateGameModel(gameModel)) {
            throw new WegasAccessDenied(gameModel, "Duplicate", "Not allowed to duplicate the scenario", this.getCurrentUser());
        }
    }

    /**
     * Assert currentUser has the right to duplicate gameModel
     *
     * @param gameModel the GameModel to check right against
     */
    public void assertCanDuplicateGameModel(final GameModel gameModel) {
        if (!canDuplicateGameModel(gameModel)) {
            throw new WegasAccessDenied(gameModel, "Duplicate", "Not allowed to duplicate the scenario", this.getCurrentUser());
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

    public Sudoer sudoer() {
        return new Sudoer(this);
    }

    /**
     * Current subject runAs another user. Effect is platform wide. It will impact all requests made
     * by the first subject until it explicitly logout.
     *
     * @see #su(java.lang.Long) for a request scope version
     * @return
     */
    public User runAs(Long accountId) {
        Subject subject = SecurityUtils.getSubject();

        if (subject.getPrincipal() != null) {
            logger.info("RunAs: User {} RunAs {}", subject.getPrincipal(), accountId);
            if (this.isAdmin()) {
                // The subject exists and is an authenticated admin
                // -> Shiro runAs
                //subject.checkRole("Administrator");
                if (subject.isRunAs()) {
                    subject.releaseRunAs();
                }

                SimplePrincipalCollection newSubject = new SimplePrincipalCollection(accountId, "jpaRealm");

                subject.runAs(newSubject);
                this.clearCurrents();
            }
        }
        return this.getCurrentUser();
    }

    public User releaseRunAs() {
        Subject subject = SecurityUtils.getSubject();

        if (subject.isRunAs()) {
            logger.info("RunAs-Release: User {} releases {}", subject.getPreviousPrincipals().toString(), subject.getPrincipal());
            subject.releaseRunAs();
            this.clearCurrents();
        }

        return this.getCurrentUser();
    }

    /**
     * Switch to another account. This is scoped to the current request only.
     *
     * @see #runAs(java.lang.Long)
     *
     * @param accountId account id to login as
     *
     * @return new currentUser
     */
    public User su(Long accountId) {
        Subject previous = null;

        try {
            Subject subject = SecurityUtils.getSubject();
            previous = subject;
        } catch (UnavailableSecurityManagerException | IllegalStateException | NullPointerException ex) { // NOPMD We don't know where NPE came from.
            // No security manager yet (startup actions)
            // craft one
            Helper.printWegasStackTrace(ex);

            // The subject does not exists -> create from strach and bind
            Collection<Realm> realms = new ArrayList<>();
            realms.add(new JpaRealm());
            realms.add(new AaiRealm());
            realms.add(new GuestRealm());

            SecurityUtils.setSecurityManager(new DefaultSecurityManager(realms));
        }

        this.previousSubjects.add(previous);

        Subject.Builder b = new Subject.Builder();
        SimplePrincipalCollection newSubject = new SimplePrincipalCollection(accountId, "jpaRealm");
        b.authenticated(true).principals(newSubject);

        Subject buildSubject = b.buildSubject();

        logger.info("SU: User {} SU to {}, {}",
            previous != null ? previous.getPrincipal() : "No-User",
            buildSubject.getPrincipal(), Thread.currentThread());

        ThreadContext.bind(buildSubject);

        this.clearCurrents();

        return this.getCurrentUser();
    }

    /**
     * exit() after su
     */
    public void releaseSu() {
        try {
            Subject subject = SecurityUtils.getSubject();
            Subject previous = null;

            this.logout(subject);

            if (!this.previousSubjects.isEmpty()) {
                previous = this.previousSubjects.removeLast();
                ThreadContext.bind(previous);
            }

            logger.info("Su-Exit -> {}",
                previous != null ? previous.getPrincipal() : "LOGOUT");

            this.clearCurrents();

            this.getCurrentUser();
        } catch (Exception ex) {
            logger.error("EX: ", ex);
        }
    }

    public Subject login(AuthenticationToken token) {
        return this.login(SecurityUtils.getSubject(), token);
    }

    public Subject login(Subject subject, AuthenticationToken token) {
        if (Helper.isLoggedIn(subject)) {
            throw WegasErrorMessage.error("You are already logged in! Please logout first");
        }
        subject.login(token);
        // clear current info
        this.clearCurrents();
        return subject;
    }

    /**
     * CDI Lookup Used by GameModel#can{Edit,View,Instantiate,Duplicate} pieces of shit
     *
     * @return
     */
    public static RequestManager lookup() {
        try {
            return Helper.lookupBy(RequestManager.class
            );
        } catch (NamingException ex) {
            return null;
        }
    }
}
