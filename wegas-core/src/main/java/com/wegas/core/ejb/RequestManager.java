/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.event.PlayerAction;
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
    private List<Exception> exceptions = new ArrayList<>();
    /**
     *
     */
    private Locale locale;

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
        this.currentPlayer = currentPlayer;
    }

    /**
     *
     * @return
     */
    public GameModel getCurrentGameModel() {
        return this.getPlayer().getGameModel();
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
    public List<Exception> getExceptions() {
        return exceptions;
    }

    /**
     *
     * @param exception
     */
    public void addException(Exception exception) {
        this.exceptions.add(exception);
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
