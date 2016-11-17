/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonPropertyOrder;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.HashMap;
import java.util.Map;
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
    //@XmlTransient
    @JsonIgnore
    private VariableInstance variableInstance;

    /**
     *
     */
    //@PrePersist
    public void prePersist() {
        //this.propagateDefaultInstance(null);
    }

    @Override
    protected void propagate(GameModel gameModel, boolean create) {
        VariableDescriptor vd = this.getVariableDescriptor();
        VariableInstance vi = this.getVariableInstance();
        if (vi == null) {
            VariableInstance clone = vd.getDefaultInstance().clone();
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
    public void propagateDefaultInstance(AbstractEntity context, boolean create) {
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
     *
     * @return
     */
    @Override
    public Map<GameModel, VariableInstance> getVariableInstances() {
        Map<GameModel, VariableInstance> ret = new HashMap<>();
        ret.put(null, getVariableInstance());
        return ret;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
    }

    /**
     *
     * @param player
     * @return
     */
    @Override
    public VariableInstance getVariableInstance(Player player) {
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
    }

    /**
     * @return the variableInstance
     */
    //@XmlTransient
    @JsonIgnore
    public VariableInstance getVariableInstance() {
        return variableInstance;
    }

    /**
     * @param variableInstance the variableInstance to set
     */
    //@XmlTransient
    @JsonIgnore
    public void setVariableInstance(VariableInstance variableInstance) {
        this.variableInstance = variableInstance;
    }

    @Override
    public Map<GameModel, VariableInstance> getPrivateInstances() {
        return this.getVariableInstances();
    }
}
