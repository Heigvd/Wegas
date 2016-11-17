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
//@XmlType(name = "TeamScope")
public class TeamScope extends AbstractScope<Team> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(TeamScope.class.getName());

    /*
     * FIXME Here we should use Team reference and add a key deserializer
     * module. @JoinTable(joinColumns = @JoinColumn(name = "teamscope_id",
     * referencedColumnName = "id"), inverseJoinColumns = @JoinColumn(name =
     * "variableinstance_id", referencedColumnName = "variableinstance_id"))
     
    @OneToMany(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true, mappedBy = "teamScope")
    @JoinColumn(name = "teamscope_id", referencedColumnName = "id")
    @MapKeyJoinColumn(name = "teamvariableinstances_key", referencedColumnName = "id")
    //@XmlTransient
    @JsonIgnore
    private Map<Team, VariableInstance> teamVariableInstances = new HashMap<>();
     */
    /**
     *
     * @return
     */
    @Override
    public Map<Team, VariableInstance> getVariableInstances() {
        return this.getVariableInstanceFacade().getAllTeamInstances(this);
    }

    /*public void setVariableInstances(Map<Team, VariableInstance> teamVariableInstances) {
        this.teamVariableInstances = teamVariableInstances;
    }*/
    /**
     *
     * @param player
     * @return
     */
    @Override
    public VariableInstance getVariableInstance(Player player) {
        return this.getVariableInstance(player.getTeam());
    }

    private VariableInstance getVariableInstance(Team t) {
        return this.getVariableInstanceFacade().getTeamInstance(this, t);
    }

    @Override
    public Map<Team, VariableInstance> getPrivateInstances() {
        Map<Team, VariableInstance> ret = new HashMap<>();
        Player cPlayer = RequestFacade.lookup().getPlayer();

        if (cPlayer != null) {
            if (this.getBroadcastScope().equals(GameScope.class.getSimpleName())) {
                for (Team t : cPlayer.getGame().getTeams()) {
                    ret.put(t, this.getVariableInstance(t));
                }
            } else {
                ret.put(cPlayer.getTeam(), this.getVariableInstance(cPlayer));
            }
        }
        return ret;
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

    /**
     *
     */
    //@PrePersist
    public void prePersist() {
        //this.propagateDefaultInstance(null);
    }

    @Override
    protected void propagate(Team t, boolean create) {
        VariableDescriptor vd = this.getVariableDescriptor();
        if (create) {
            VariableInstance newInstance = vd.getDefaultInstance().clone();
            //t.setPrivateInstance(ListUtils.cloneAdd(t.getPrivateInstances(), newInstance));
            t.getPrivateInstances().add(newInstance);
            this.setVariableInstance(t, newInstance);

            //vif.create(newInstance);  //<----
        } else {
            VariableInstance vi = this.getVariableInstance(t);
            Long version = vi.getVersion();
            vi.merge(vd.getDefaultInstance());
            vi.setVersion(version);
        }
    }

    @Override
    public void propagateDefaultInstance(AbstractEntity context, boolean create) {
        //logger.info("Propagating default instance for VariableDescriptor: {}", this.getVariableDescriptor());
        if (context instanceof Player) {
            // No need to propagate since the team already exists
        } else if (context instanceof Team) {
            propagate((Team) context, create);
        } else if (context instanceof Game) {
            propagate((Game) context, create);
        } else {
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
}
