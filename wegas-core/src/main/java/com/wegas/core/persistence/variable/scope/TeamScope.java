/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import javax.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class TeamScope extends AbstractScope<Team> {

    private static final long serialVersionUID = 1L;

    /**
     * Return a instance which is accessible by the player
     *
     * @param player the player who request the instance
     *
     * @return the instance which belongs to the player's team
     */
    @Override
    public VariableInstance getVariableInstance(Player player) {
        return this.getVariableInstance(player.getTeam());
    }

    @Override
    public ScopeType getScopeType() {
        return ScopeType.TeamScope;
    }

    /**
     * Get the team's instance
     *
     * @param t instance owner
     *
     * @return the team's instance
     */
    @Override
    public VariableInstance getVariableInstance(Team t) {
        return this.getVariableInstanceFacade().getTeamInstance(this, t);
    }

    /**
     *
     * @param key
     * @param v
     */
    @Override
    public void setVariableInstance(Team key, VariableInstance v) {
        //this.getVariableInstances().put(key, v);
        //v.setTeamScopeKey(key.getId());
        v.setTeam(key);
        v.setTeamScope(this);
    }

    @Override
    protected void propagate(Team t, boolean create) {
        VariableDescriptor vd = this.getVariableDescriptor();
        if (create) {
            try {
                VariableInstance newInstance = vd.getDefaultInstance().duplicate();
                //t.setPrivateInstance(ListUtils.cloneAdd(t.getPrivateInstances(), newInstance));
                t.getPrivateInstances().add(newInstance);
                this.setVariableInstance(t, newInstance);

                //vif.create(newInstance);  //<----
            } catch (CloneNotSupportedException ex) {
                throw WegasErrorMessage.error("Clone VariableInstance ERROR : " + ex);
            }
        } else {
            this.getVariableInstance(t).merge(vd.getDefaultInstance());
        }
    }

    @Override
    public void propagateDefaultInstance(InstanceOwner context, boolean create) {
        //logger.info("Propagating default instance for VariableDescriptor: {}", this.getVariableDescriptor());
        /*if (context instanceof Player) {
            // No need to propagate since the team already exists
        } */
        if (context instanceof Team) {
            propagate((Team) context, create);
        } else if (context instanceof Game) {
            propagate((Game) context, create);
        } else if (context == null || context instanceof GameModel) {
            propagate(getVariableDescriptor().getGameModel(), create);
        }
    }
}
