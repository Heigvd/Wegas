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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonPropertyOrder(value = {"@class", "id", "name"})
public class GameModelScope extends AbstractScope<GameModel> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(GameModelScope.class);
    /**
     *
     */
    @OneToOne(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY)
    @JsonIgnore
    private VariableInstance variableInstance;

    @Override
    protected void propagate(GameModel gameModel, boolean create) {
        VariableDescriptor vd = this.getVariableDescriptor();
        VariableInstance vi = this.getVariableInstance();
        if (vi == null) {
            VariableInstance clone = vd.getDefaultInstance().clone();
            gameModel.getPrivateInstances().add(clone);
            this.setVariableInstance(gameModel, clone);
        } else {
            Long version = vi.getVersion();
            vi.merge(vd.getDefaultInstance());
            vi.setVersion(version);
        }
    }

    /**
     *
     * @param context
     */
    @JsonIgnore
    @Override
    public void propagateDefaultInstance(InstanceOwner context, boolean create) {
        if (context instanceof Player) {
            // Since player's gamemodel already exists, nothing to propagate
        } else if (context instanceof Team) {
            // Since team's gamemodel already exists, nothing to propagate
        } else if (context instanceof Game) {
            // Since game's gamemodel already exists, nothing to propagate
        } else {
            propagate(getVariableDescriptor().getGameModel(), create);
        }
    }

    /**
     * Return the instance which is accessible by the player
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
