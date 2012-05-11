/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import javax.enterprise.context.RequestScoped;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.inject.Named;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
//@Named
//@RequestScoped
public class GameManager {

    /**
     *
     */
    @Inject
    Event<PlayerAction> playerActionEvent;
    /**
     *
     */
    private PlayerEntity currentPlayer;
    /**
     *
     */
    private List<VariableInstanceEntity> updatedInstances = new ArrayList<>();
    /**
     *
     */
    private GameModelEntity gameModel;

    /**
     *
     */
    public void commit() {
        if (this.getUpdatedInstances().size() > 0) {
            PlayerAction action = new PlayerAction();
            action.setPlayer(this.getCurrentPlayer());
            playerActionEvent.fire(action);
        }
    }

    /**
     * @return the currentPlayer
     */
    public PlayerEntity getCurrentPlayer() {
        return currentPlayer;
    }

    /**
     * @param currentPlayer the currentPlayer to set
     */
    public void setCurrentPlayer(PlayerEntity currentPlayer) {
        this.currentPlayer = currentPlayer;
    }

    public GameModelEntity getGameModel() {
        return gameModel;
    }

    public void setGameModel(GameModelEntity gameModel) {
        this.gameModel = gameModel;
    }

    public void addUpdatedInstance(VariableInstanceEntity instance) {
        if (!this.getUpdatedInstances().contains(instance)) {
            this.getUpdatedInstances().add(instance);
        }
    }

    /**
     * @return the updatedInstances
     */
    public List<VariableInstanceEntity> getUpdatedInstances() {
        return updatedInstances;
    }

    /**
     * @param updatedInstances the updatedInstances to set
     */
    public void setUpdatedInstances(List<VariableInstanceEntity> updatedInstances) {
        this.updatedInstances = updatedInstances;
    }

    public void clearUpdatedInstances() {
        this.updatedInstances.clear();
    }

    public class PlayerAction implements Serializable {

        /**
         *
         */
        private PlayerEntity player;

        /**
         * @return the player
         */
        public PlayerEntity getPlayer() {
            return player;
        }

        /**
         * @param player the player to set
         */
        public void setPlayer(PlayerEntity player) {
            this.player = player;
        }
    }
}
