/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

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
    private Locale local;
    
    /**
     *
     */
    public void commit() {
        if (this.getUpdatedInstances().size() > 0) {
            PlayerAction action = new PlayerAction();
            action.setPlayer(this.getPlayer());
            playerActionEvent.fire(action);
        }
    }

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
     * @return the ResourceBundle
     */
    public ResourceBundle getBundle(String bundle){
        return ResourceBundle.getBundle("localisation.errors", lang); 
    }

    /**
     * @return the local
     */
    public Locale getLocal() {
        return local;
    }

    /**
     * @param local the local to set
     */
    public void setLocal(Locale local) {
        this.local = local;
    }

    /**
     *
     */
    public class PlayerAction implements Serializable {

        /**
         *
         */
        private Player player;

        /**
         * @return the player
         */
        public Player getPlayer() {
            return player;
        }

        /**
         * @param player the player to set
         */
        public void setPlayer(Player player) {
            this.player = player;
        }
    }
}
