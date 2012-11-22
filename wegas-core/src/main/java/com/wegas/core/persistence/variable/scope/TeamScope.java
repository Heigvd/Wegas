/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable.scope;

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
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "TeamScope", propOrder = {"@class", "id", "name"})
public class TeamScope extends AbstractScope {

    private static final Logger logger = LoggerFactory.getLogger(TeamScope.class.getName());
    /*
     * FIXME Here we should use Team reference and add a key deserializer
     * module. @JoinTable(joinColumns = @JoinColumn(name = "teamscope_id",
     * referencedColumnName = "id"), inverseJoinColumns = @JoinColumn(name =
     * "variableinstance_id", referencedColumnName = "variableinstance_id"))
     */
    @OneToMany(cascade = {CascadeType.PERSIST, CascadeType.REMOVE}, fetch = FetchType.LAZY)
    @JoinColumn(name = "teamscope_id", referencedColumnName = "id")
    @XmlTransient
    @JsonIgnore
    private Map<Long, VariableInstance> teamVariableInstances = new HashMap<Long, VariableInstance>();

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

    /**
     *
     * @param userId
     * @param v
     */
    @Override
    public void setVariableInstance(Long userId, VariableInstance v) {
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
    @Override
    public void propagateDefaultInstance(boolean force) {
        logger.debug("Propagating default instance for VariableDescriptor: {}", this.getVariableDescriptor());

        VariableDescriptor vd = this.getVariableDescriptor();
        GameModel gm = vd.getGameModel();
        for (Game g : gm.getGames()) {
            for (Team t : g.getTeams()) {
                VariableInstance vi = this.teamVariableInstances.get(t.getId());
                if (vi == null) {
                    this.setVariableInstance(t.getId(), vd.getDefaultInstance().clone());
                } else if (force) {
                    vi.merge(vd.getDefaultInstance());
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
