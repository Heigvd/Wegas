/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @todo Needs to be implemented
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "GameScope")
public class GameScope extends AbstractScope {

    private static final Logger logger = LoggerFactory.getLogger(GameScope.class);
    /**
     *
     */
    @OneToMany(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true)
    @JoinColumn(name = "gamescope_id", referencedColumnName = "id")
    @XmlTransient
    @JsonIgnore
    private Map<Long, VariableInstance> gameVariableInstances = new HashMap<>();

    @Override
    public void setVariableInstance(Long key, VariableInstance v) {
        this.gameVariableInstances.put(key, v);
        v.setScope(this);
    }

    @Override
    public VariableInstance getVariableInstance(Player player) {
        return this.gameVariableInstances.get(player.getGame().getId());
    }

    @Override
    public Map<Long, VariableInstance> getVariableInstances() {
        return this.gameVariableInstances;
    }

    @Override
    public void propagateDefaultInstance(boolean force) {
        VariableDescriptor vd = this.getVariableDescriptor();
        GameModel gm = vd.getGameModel();
        for (Game g : gm.getGames()) {
            VariableInstance vi = this.gameVariableInstances.get(g.getId());
            if (vi == null) {
                this.setVariableInstance(g.getId(), vd.getDefaultInstance().clone());
            } else if (force) {
                vi.merge(vd.getDefaultInstance());
            }
        }
    }

    @Override
    public void merge(AbstractEntity a) {
        //
    }
}
