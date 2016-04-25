/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
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
import javax.persistence.PrePersist;
////import javax.xml.bind.annotation.XmlTransient;
//import javax.xml.bind.annotation.XmlType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.game.Team;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @todo Needs to be implemented
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
//@XmlType(name = "GameScope")
public class GameScope extends AbstractScope {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(GameScope.class);
    @OneToMany(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true, mappedBy = "gameScope")
    @JoinColumn(name = "gamescope_id", referencedColumnName = "id")
    //@XmlTransient
    @JsonIgnore
    private Map<Long, VariableInstance> gameVariableInstances = new HashMap<>();

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        this.propagateDefaultInstance(null);
    }

    @Override
    public void setVariableInstance(Long key, VariableInstance v) {
        this.getVariableInstances().put(key, v);
        v.setGameScopeKey(key);
        v.setGameScope(this);
    }

    @Override
    public VariableInstance getVariableInstance(Player player) {
        return this.getVariableInstances().get(player.getGame().getId());
    }

    @Override
    public Map<Long, VariableInstance> getVariableInstances() {
        return this.gameVariableInstances;
    }

    @Override
    protected void propagate(Game g) {
        VariableDescriptor vd = this.getVariableDescriptor();
        VariableInstance vi = this.getVariableInstances().get(g.getId());
        if (vi == null) {
            VariableInstance clone = vd.getDefaultInstance().clone();
            g.getPrivateInstances().add(clone);
            this.setVariableInstance(g.getId(), clone);
        } else {
            vi.merge(vd.getDefaultInstance());
        }
    }

    @Override
    public void propagateDefaultInstance(AbstractEntity context) {
        if (context instanceof Player) {
            // Since player's game already exists, nothing to propagate
        } else if (context instanceof Team) {
            // Since teams's game already exists, nothing to propagate
        } else if (context instanceof Game) {
            propagate((Game) context);
        } else {
            propagate(getVariableDescriptor().getGameModel());
        }
    }

    @Override
    public void merge(AbstractEntity a) {
        //
    }

    @Override
    public Map<Long, VariableInstance> getPrivateInstances() {
        Map<Long, VariableInstance> ret = new HashMap<>();
        Player cPlayer = RequestFacade.lookup().getPlayer();

        ret.put(cPlayer.getGame().getId(), this.getVariableInstance(cPlayer));
        return ret;
    }
}
