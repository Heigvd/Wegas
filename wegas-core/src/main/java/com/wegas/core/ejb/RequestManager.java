/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.Helper;
import com.wegas.core.event.client.ClientEvent;
import com.wegas.core.event.client.CustomEvent;
import com.wegas.core.event.client.ExceptionEvent;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.rest.util.Views;
import jdk.nashorn.api.scripting.ScriptUtils;
import jdk.nashorn.internal.runtime.ScriptObject;

import javax.enterprise.context.RequestScoped;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.inject.Named;
import javax.script.ScriptEngine;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.ResourceBundle;

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Named("RequestManager")
@RequestScoped
public class RequestManager {

    @Inject
    private Event<NumberUpdate> updatedNumber;

    /**
     *
     */
    private Class view = Views.Public.class;

    /**
     *
     */
    private Player currentPlayer;

    /**
     *
     */
    private List<AbstractEntity> updatedEntities = new ArrayList<>();

    private Map<String, List<AbstractEntity>> dispatchedEntities = new HashMap<>();

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

    public void addUpdatedEntities(Map<String, List<AbstractEntity>> entities) {
        if (entities != null) {
            for (String audience : entities.keySet()) {
                this.addUpdatedEntity(audience, entities.get(audience));
            }
        }
    }

    public void addUpdatedEntity(String audience, List<AbstractEntity> updated) {
        for (AbstractEntity entity : updated) {
            this.addUpdatedEntity(audience, entity);
        }
    }

    public void addUpdatedEntity(String audience, AbstractEntity updated) {
        if (!dispatchedEntities.containsKey(audience)) {
            dispatchedEntities.put(audience, new ArrayList<>());
        }
        List<AbstractEntity> entities = dispatchedEntities.get(audience);
        if (!entities.contains(updated)) {
            entities.add(updated);
        }

        if (!updatedEntities.contains(updated)) {
            this.updatedEntities.add(updated);
        }
    }

    /**
     * https://java.net/jira/browse/GLASSFISH-21195 this event should be fired
     * from {@link com.wegas.core.persistence.NumberListener}
     *
     * @param numberInstance to be forwarded to event
     */
    public void numberChanged(NumberInstance numberInstance) { // @TODO remove me
        updatedNumber.fire(new NumberUpdate(this.getPlayer(), numberInstance));
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
        this.currentPlayer = currentPlayer;
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
     * @return the updatedInstances
     */
    public List<AbstractEntity> getUpdatedEntites() {
        return updatedEntities;
    }

    /**
     *
     * @param updatedEntities
     */
    public void setUpdatedEntities(List<AbstractEntity> updatedEntities) {
        this.updatedEntities = updatedEntities;
    }

    /**
     *
     */
    public void clearUpdatedEntities() {
        this.updatedEntities.clear();
        this.dispatchedEntities.clear();
    }

    public Map<String, List<AbstractEntity>> getDispatchedEntities() {
        return dispatchedEntities;
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
        ArrayList<WegasRuntimeException> exceptions = new ArrayList();
        exceptions.add(e);
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

    public class NumberUpdate {

        final public Player player;

        final public NumberInstance number;

        NumberUpdate(Player player, NumberInstance number) {
            this.number = number;
            this.player = player;
        }
    }
}
