/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.*;
////import javax.xml.bind.annotation.XmlTransient;
//import javax.xml.bind.annotation.XmlType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
//@XmlType(name = "PlayerScope")
public class PlayerScope extends AbstractScope {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(PlayerScope.class);
    /*
     * FIXME Here we should use UserEntity reference and add a key deserializer
     * module
     */
    @OneToMany(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true, mappedBy = "playerScope")
    @JoinColumn(name = "playerscope_id", referencedColumnName = "id")
    //@XmlTransient
    @JsonIgnore
    private Map<Long, VariableInstance> variableInstances = new HashMap<>();

    /**
     *
     * @return
     */
    @Override
    public Map<Long, VariableInstance> getVariableInstances() {
        return this.variableInstances;
    }

    /**
     *
     * @param player
     * @return
     */
    @Override
    public VariableInstance getVariableInstance(Player player) {
        return this.getVariableInstances().get(player.getId());
    }

    /**
     *
     * @param v
     */
    @Override
    public void setVariableInstance(Long key, VariableInstance v) {
        this.getVariableInstances().put(key, v);
        v.setPlayerScopeKey(key);
        v.setPlayerScope(this);
    }

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        this.propagateDefaultInstance(null);
    }

    /**
     * Propagate instances for the given player
     *
     * @param p instance owner
     */
    @Override
    protected void propagate(Player p) {
        VariableDescriptor vd = getVariableDescriptor();
        VariableInstance vi = this.getVariableInstances().get(p.getId());
        if (vi == null) {
            VariableInstance clone = vd.getDefaultInstance().clone();
            p.getPrivateInstances().add(clone);
            this.setVariableInstance(p.getId(), clone);
        } else {
            vi.merge(vd.getDefaultInstance());
        }
    }

    @Override
    public void propagateDefaultInstance(AbstractEntity context) {
        if (context instanceof Player) {
            propagate((Player) context);
        } else if (context instanceof Team) {
            propagate((Team) context);
        } else if (context instanceof Game) {
            propagate((Game) context);
        } else { // instanceof GameModel or null
            propagate(getVariableDescriptor().getGameModel());
        }
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
    }

    @Override
    public Map<Long, VariableInstance> getPrivateInstances() {
        Map<Long, VariableInstance> ret = new HashMap<>();
        Player cPlayer = RequestFacade.lookup().getPlayer();

        if (this.getBroadcastScope().equals(GameScope.class.getSimpleName())) {
            for (Team t : cPlayer.getGame().getTeams()) {
                for (Player p : t.getPlayers()) {
                    ret.put(p.getId(), this.getVariableInstance(p));
                }
            }
        } else if (this.getBroadcastScope().equals(TeamScope.class.getSimpleName())) {
            for (Player p : cPlayer.getTeam().getPlayers()) {
                ret.put(p.getId(), this.getVariableInstance(p));
            }
        } else {
            ret.put(cPlayer.getId(), this.getVariableInstance(cPlayer));
        }
        return ret;
    }
}
