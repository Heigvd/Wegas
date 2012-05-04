/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.GameEntity;
import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.game.TeamEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "TeamScope", propOrder = {"@class", "id", "name"})
public class TeamScopeEntity extends AbstractScopeEntity {

    private static final Logger logger = LoggerFactory.getLogger(TeamScopeEntity.class.getName());
    /*
     * FIXME Here we should use TeamEntity reference and add a key deserializer
     * module. @JoinTable(joinColumns = @JoinColumn(name = "teamscope_id",
     * referencedColumnName = "id"), inverseJoinColumns = @JoinColumn(name =
     * "variableinstance_id", referencedColumnName = "variableinstance_id"))
     */
    @OneToMany(cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    @JoinColumn(name = "teamscope_id", referencedColumnName = "id")
    @XmlTransient
    private Map<Long, VariableInstanceEntity> teamVariableInstances = new HashMap<>();

    /**
     *
     * @return
     */
    @Override
    public Map<Long, VariableInstanceEntity> getVariableInstances() {
        return this.teamVariableInstances;
    }

    /**
     *
     * @param player
     * @return
     */
    @Override
    public VariableInstanceEntity getVariableInstance(PlayerEntity player) {
        return this.teamVariableInstances.get(player.getTeam().getId());
    }

    /**
     *
     * @param userId
     * @param v
     */
    @Override
    public void setVariableInstance(Long userId, VariableInstanceEntity v) {
        this.teamVariableInstances.put(userId, v);
        v.setScope(this);
    }

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        this.propagateDefaultInstance(false);
    }

    /**
     *
     * @param force
     */
    @XmlTransient
    @Override
    public void propagateDefaultInstance(boolean force) {
        logger.debug("Propagating default instance for VariableDescriptor: {}", this.getVariableDescriptor());

        VariableDescriptorEntity vd = this.getVariableDescriptor();
        GameModelEntity gm = vd.getGameModel();
        for (GameEntity g : gm.getGames()) {
            for (TeamEntity t : g.getTeams()) {
                VariableInstanceEntity vi = this.teamVariableInstances.get(t.getId());
                if (vi == null) {
                    this.setVariableInstance(t.getId(), vd.getDefaultVariableInstance().clone());
                } else if (force) {
                    vi.merge(vd.getDefaultVariableInstance());
                }
            }
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
