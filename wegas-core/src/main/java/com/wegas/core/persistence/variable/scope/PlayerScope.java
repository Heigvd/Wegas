/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
//@XmlType(name = "PlayerScope")
public class PlayerScope extends AbstractScope<Player> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(PlayerScope.class);

    /*
     * FIXME Here we should use UserEntity reference and add a key deserializer
     * module
    @OneToMany(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true, mappedBy = "playerScope")
    @JoinColumn(name = "playerscope_id", referencedColumnName = "id")
    @MapKeyJoinColumn(name = "variableinstances_key", referencedColumnName = "id")
    //@XmlTransient
    @JsonIgnore
    private Map<Player, VariableInstance> variableInstances = new HashMap<>();
     */
    /**
     *
     * @return
     */
    @Override
    public Map<Player, VariableInstance> getVariableInstances() {
        return this.getVariableInstanceFacade().getAllPlayerInstances(this);
    }

    /**
     *
     * @param player
     * @return
     */
    @Override
    public VariableInstance getVariableInstance(Player player) {
        return this.getVariableInstanceFacade().getPlayerInstance(this, player);
    }

    /**
     *
     * @param v
     */
    @Override
    public void setVariableInstance(Player key, VariableInstance v) {
        //this.getVariableInstances().put(key, v);
        v.setPlayer(key);
        v.setPlayerScope(this);
    }

    /**
     *
     */
    //@PrePersist
    public void prePersist() {
        //this.propagateDefaultInstance(null);
    }

    /**
     * Propagate instances for the given player
     *
     * @param p instance owner
     */
    @Override
    protected void propagate(Player p, boolean create) {
        VariableDescriptor vd = getVariableDescriptor();
        if (create) {
            VariableInstance clone = vd.getDefaultInstance().clone();
            p.getPrivateInstances().add(clone);
            this.setVariableInstance(p, clone);
            //vif.create(clone);
        } else {
            VariableInstance vi = this.getVariableInstance(p);
            Long version = vi.getVersion();
            vi.merge(vd.getDefaultInstance());
            vi.setVersion(version);
        }
    }

    @Override
    public void propagateDefaultInstance(AbstractEntity context, boolean create) {
        if (context instanceof Player) {
            propagate((Player) context, create);
        } else if (context instanceof Team) {
            propagate((Team) context, create);
        } else if (context instanceof Game) {
            propagate((Game) context, create);
        } else { // instanceof GameModel or null
            propagate(getVariableDescriptor().getGameModel(), create);
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
    public Map<Player, VariableInstance> getPrivateInstances() {
        Map<Player, VariableInstance> ret = new HashMap<>();
        Player cPlayer = RequestFacade.lookup().getPlayer();
        VariableInstanceFacade vif = VariableInstanceFacade.lookup();

        if (this.getBroadcastScope().equals(GameScope.class.getSimpleName())) {
            for (Team t : cPlayer.getGame().getTeams()) {
                for (Player p : t.getPlayers()) {
                    ret.put(p, this.getVariableInstance(p));
                }
            }
        } else if (this.getBroadcastScope().equals(TeamScope.class.getSimpleName())) {
            for (Player p : cPlayer.getTeam().getPlayers()) {
                ret.put(p, this.getVariableInstance(p));
            }
        } else {
            ret.put(cPlayer, this.getVariableInstance(cPlayer));
        }
        return ret;
    }
}
