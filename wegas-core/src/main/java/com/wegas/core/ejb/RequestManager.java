/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.client.ClientEvent;
import com.wegas.core.event.client.CustomEvent;
import com.wegas.core.event.client.ExceptionEvent;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.rest.util.Views;
import jdk.nashorn.api.scripting.ScriptUtils;
import jdk.nashorn.internal.runtime.ScriptObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.annotation.PreDestroy;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.inject.Named;
import javax.script.ScriptEngine;
import java.util.*;
import java.util.concurrent.TimeUnit;
import javax.ejb.DependsOn;
import javax.ws.rs.core.Response;

//import javax.annotation.PostConstruct;
/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Named("RequestManager")
@RequestScoped
@DependsOn("MutexSingleton")
public class RequestManager {

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
    MutexSingleton mutexSingleton;

    @EJB
    private PlayerFacade playerFacade;

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

    private String requestId;
    private Long timestamp;
    private Response.StatusType status;
    private Long exceptionCounter = 0L;

    /**
     * Contains all updated entities
     */
    private Map<String, List<AbstractEntity>> updatedEntities = new HashMap<>();

    private Map<String, List<AbstractEntity>> outdatedEntities = new HashMap<>();

    private Map<String, List<AbstractEntity>> destroyedEntities = new HashMap<>();

    /**
     *
     */
    private List<String> lockedToken = new ArrayList<>();

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
    private ScriptEngine currentEngine = null;

    public RequestEnvironment getEnv() {
        return env;
    }

    public void setEnv(RequestEnvironment env) {
        this.env = env;
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

    public void addEntities(Map<String, List<AbstractEntity>> entities, Map<String, List<AbstractEntity>> container) {
        if (entities != null) {
            for (Map.Entry<String, List<AbstractEntity>> entry : entities.entrySet()) {
                this.addEntities(entry.getKey(), entry.getValue(), container);
            }
        }
    }

    public void addEntities(String audience, List<AbstractEntity> updated, Map<String, List<AbstractEntity>> container) {
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
     * @param currentPlayer the currentPlayer to set
     */
    public void setPlayer(Player currentPlayer) {
        if (this.currentPlayer == null || !this.currentPlayer.equals(currentPlayer)) {
            this.setCurrentEngine(null);
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
     * @return the currentEngine
     */
    public ScriptEngine getCurrentEngine() {
        return currentEngine;
    }

    /**
     * @param currentEngine the currentEngine to set
     */
    public void setCurrentEngine(ScriptEngine currentEngine) {
        this.currentEngine = currentEngine;
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

    public boolean tryLock(String token) {
        boolean tryLock = mutexSingleton.tryLock(token);
        if (tryLock) {
            // Only register token if successfully locked
            lockedToken.add(token);
        }
        return tryLock;
    }

    public void lock(String token) {
        mutexSingleton.lock(token);
        lockedToken.add(token);
    }

    public void unlock(String token) {
        mutexSingleton.unlock(token);
        if (lockedToken.contains(token)) {
            lockedToken.remove(token);
        }
    }

    public void setStatus(Response.StatusType statusInfo) {
        this.status = statusInfo;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public void setRequestId(String uniqueIdentifier) {
        this.requestId = uniqueIdentifier;
    }

    /**
     * Lifecycle
     */
    /*@PostConstruct
    public void postConstruct() {
        logger.error("Request Manager: PostConstruct: " + this);
    }*/
    @PreDestroy
    public void preDestroy() {
        while (!lockedToken.isEmpty()) {
            String remove = lockedToken.remove(0);
            mutexSingleton.unlockFull(remove);
        }
        long duration = System.currentTimeMillis() - this.timestamp;

        logger.info("Request [" + this.requestId + "] Processed in " + duration
                + " [ms] => " + this.status);
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
}
