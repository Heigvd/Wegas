/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.client.CustomEvent;
import com.wegas.core.event.client.ExceptionEvent;
import com.wegas.core.event.internal.PlayerAction;
import com.wegas.core.event.client.ClientEvent;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.ResourceBundle;
import javax.enterprise.context.RequestScoped;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.inject.Named;
import javax.script.ScriptEngine;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Named("RequestManager")
@RequestScoped
public class RequestManager implements Serializable {

    /**
     *
     */
    @Inject
    Event<PlayerAction> playerActionEvent;
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
    private List<VariableInstance> updatedInstances = new ArrayList<>();
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

    /**
     *
     * @param instance
     */
    public void addUpdatedInstance(VariableInstance instance) {
        if (!this.getUpdatedInstances().contains(instance)) {
            this.getUpdatedInstances().add(instance);
        }
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
       if ((this.currentPlayer == null) || (currentPlayer == null) || (currentPlayer.getId() != this.currentPlayer.getId())) {
            this.currentPlayer = currentPlayer;
            this.setCurrentEngine(null);
        }
    }

    /**
     *
     * @return
     */
    public GameModel getCurrentGameModel() {
        return this.getPlayer().getGameModel();
    }

    public ScriptEngine getCurrentEngine() {
        return currentEngine;
    }

    public void setCurrentEngine(ScriptEngine currentEngine) {
        this.currentEngine = currentEngine;
    }

    /**
     * @return the updatedInstances
     */
    public List<VariableInstance> getUpdatedInstances() {
        return updatedInstances;
    }

    /**
     * @param updatedInstances the updatedInstances to set
     */
    public void setUpdatedInstances(List<VariableInstance> updatedInstances) {
        this.updatedInstances = updatedInstances;
    }

    /**
     *
     */
    public void clearUpdatedInstances() {
        this.updatedInstances.clear();
    }

    /**
     *
     * @return
     */
    public List<ClientEvent> getClientEvents() {
        return events;
    }

    /**
     *
     * @param exception
     */
    public void addEvent(ClientEvent event) {
        this.events.add(event);
    }

    public void addException(Exception e) {
        ArrayList exceptions = new ArrayList();
        exceptions.add(e);
        this.addEvent(new ExceptionEvent(exceptions));
    }

    public void sendCustomEvent(String type, Object payload) {
        this.addEvent(new CustomEvent(type, payload));
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
     *
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
}
