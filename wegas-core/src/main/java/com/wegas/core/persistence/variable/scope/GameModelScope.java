/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToOne;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonPropertyOrder(value = {"@class", "id", "name"})
public class GameModelScope extends AbstractScope<GameModel> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToOne(mappedBy = "gameModelScope", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    @JsonIgnore
    private VariableInstance variableInstance;

    @Override
    public ScopeType getScopeType() {
        return ScopeType.GameModelScope;
    }

    @Override
    protected void propagate(GameModel gameModel, boolean create) {
        VariableDescriptor vd = this.getVariableDescriptor();
        VariableInstance vi = this.getVariableInstance();
        if (vi == null) {
            try {
                VariableInstance clone = vd.getDefaultInstance().duplicate();
                gameModel.getPrivateInstances().add(clone);
                this.setVariableInstance(gameModel, clone);
            } catch (CloneNotSupportedException ex) {
                throw WegasErrorMessage.error("Clone VariableInstance ERROR : " + ex);
            }
        } else {
            vi.merge(vd.getDefaultInstance());
        }
    }

    /**
     *
     * @param context
     */
    @JsonIgnore
    @Override
    public void propagateDefaultInstance(InstanceOwner context, boolean create) {
        if (context == null || context instanceof GameModel) {
            // GameModelScope only cares about global contexts
            propagate(getVariableDescriptor().getGameModel(), create);
        }
    }

    /**
     *
     * @param player the player who request the instance
     *
     * @return the gameModel's instance
     */
    @Override
    public VariableInstance getVariableInstance(Player player) {
        return this.getVariableInstance((GameModel) null);
    }

    /**
     * Return the instance which is accessible by team
     *
     * @param team the team who request the instance
     *
     * @return the gameModel's instance
     */
    @Override
    public VariableInstance getVariableInstance(Team team) {
        return this.getVariableInstance((GameModel) null);
    }

    /**
     * Return the instance which is accessible by game
     *
     * @param game the game who request the instance
     *
     * @return the gameModel's instance
     */
    @Override
    public VariableInstance getVariableInstance(Game game) {
        return this.getVariableInstance((GameModel) null);
    }

    /**
     * Return the instance which is linked to gameModel
     *
     * @param gameModel the gameModel for which instance is required
     *
     * @return the gameModel's instance
     */
    @Override
    public VariableInstance getVariableInstance(GameModel gameModel) {
        return this.variableInstance;
    }

    /**
     *
     * @param key
     * @param v
     */
    @Override
    public void setVariableInstance(GameModel key, VariableInstance v) {
        this.setVariableInstance(v);
        v.setGameModelScope(this);
        v.setGameModel(key);
    }

    /**
     * @return the variableInstance
     */
    @JsonIgnore
    public VariableInstance getVariableInstance() {
        return variableInstance;
    }

    /**
     * @param variableInstance the variableInstance to set
     */
    @JsonIgnore
    public void setVariableInstance(VariableInstance variableInstance) {
        this.variableInstance = variableInstance;
    }
}
