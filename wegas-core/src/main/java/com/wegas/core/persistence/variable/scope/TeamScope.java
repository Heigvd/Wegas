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
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.*;
////import javax.xml.bind.annotation.XmlTransient;
//import javax.xml.bind.annotation.XmlType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
//@XmlType(name = "TeamScope")
public class TeamScope extends AbstractScope {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(TeamScope.class.getName());
    /*
     * FIXME Here we should use Team reference and add a key deserializer
     * module. @JoinTable(joinColumns = @JoinColumn(name = "teamscope_id",
     * referencedColumnName = "id"), inverseJoinColumns = @JoinColumn(name =
     * "variableinstance_id", referencedColumnName = "variableinstance_id"))
     */
    @OneToMany(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true, mappedBy = "teamScope")
    @JoinColumn(name = "teamscope_id", referencedColumnName = "id")
    //@XmlTransient
    @JsonIgnore
    private Map<Long, VariableInstance> teamVariableInstances = new HashMap<>();

    /**
     *
     * @return
     */
    @Override
    public Map<Long, VariableInstance> getVariableInstances() {
        return this.teamVariableInstances;
    }

    /**
     *
     * @param player
     * @return
     */
    @Override
    public VariableInstance getVariableInstance(Player player) {
        return this.teamVariableInstances.get(player.getTeam().getId());
    }

    @Override
    public Map<Long, VariableInstance> getPrivateInstances() {
        Map<Long, VariableInstance> ret = new HashMap<>();
        Player cPlayer = RequestFacade.lookup().getPlayer();

        if (cPlayer != null) {
            if (this.getBroadcastScope().equals(GameScope.class.getSimpleName())) {
                for (Team t : cPlayer.getGame().getTeams()) {
                    ret.put(t.getId(), this.teamVariableInstances.get(t.getId()));
                }
            } else {
                ret.put(cPlayer.getTeam().getId(), this.getVariableInstance(cPlayer));
            }
        }
        return ret;
    }

    /**
     *
     * @param teamId
     * @param v
     */
    @Override
    public void setVariableInstance(Long teamId, VariableInstance v) {
        this.teamVariableInstances.put(teamId, v);
        v.setTeamScopeKey(teamId);
        v.setTeamScope(this);
    }

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        this.propagateDefaultInstance(null);
    }

    @Override
    protected void propagate(Team t) {
        VariableDescriptor vd = this.getVariableDescriptor();
        VariableInstance vi = this.teamVariableInstances.get(t.getId());
        if (vi == null) {
            this.setVariableInstance(t.getId(), vd.getDefaultInstance().clone());
        } else {
            vi.merge(vd.getDefaultInstance());
        }
    }

    @Override
    public void propagateDefaultInstance(Object context) {
        //logger.info("Propagating default instance for VariableDescriptor: {}", this.getVariableDescriptor());
        if (context instanceof Player) {
            // No need to propagate since the team already exists
        } else if (context instanceof Team) {
            propagate((Team) context);
        } else if (context instanceof Game) {
            propagate((Game) context);
        } else {
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
}
