/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import javax.persistence.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class PlayerScope extends AbstractScope<Player> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(PlayerScope.class);

    /**
     * Get the instances which belongs to the player
     *
     * @param player instance owner
     *
     * @return the player's instance
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
    public void propagateDefaultInstance(InstanceOwner context, boolean create) {
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
}
