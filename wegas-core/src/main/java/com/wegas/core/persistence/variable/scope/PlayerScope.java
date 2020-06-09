
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
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable.Status;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.survey.persistence.SurveyDescriptor;
import com.wegas.survey.persistence.input.SurveyInputDescriptor;
import com.wegas.survey.persistence.input.SurveySectionDescriptor;
import javax.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class PlayerScope extends AbstractScope<Player> {

    private static final long serialVersionUID = 1L;

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

    @Override
    public ScopeType getScopeType() {
        return ScopeType.PlayerScope;
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

        if (p.getStatus().equals(Status.SURVEY) && !(vd instanceof SurveyDescriptor
            || vd instanceof SurveySectionDescriptor
            || vd instanceof SurveyInputDescriptor)) {
            // only proceed Survey related variable for SURVEY players
            return;
        }

        if (create) {
            try {
                VariableInstance clone = vd.getDefaultInstance().duplicate();
                p.getPrivateInstances().add(clone);
                this.setVariableInstance(p, clone);
                //vif.create(clone);
            } catch (CloneNotSupportedException ex) {
                throw WegasErrorMessage.error("Clone VariableInstance ERROR : " + ex);
            }
        } else {
            this.getVariableInstance(p).merge(vd.getDefaultInstance());
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
