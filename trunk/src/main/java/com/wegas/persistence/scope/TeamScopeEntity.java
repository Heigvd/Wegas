/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.persistence.scope;

import com.wegas.persistence.AnonymousEntity;
import com.wegas.persistence.GameModelEntity;
import com.wegas.persistence.TeamEntity;
import com.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.wegas.persistence.variableinstance.VariableInstanceEntity;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.persistence.PrePersist;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "TeamScope", propOrder = {"@class", "id", "name"})
public class TeamScopeEntity extends ScopeEntity {

    private static final Logger logger = Logger.getLogger(TeamScopeEntity.class.getName());
    /*
     * FIXME Here we should use TeamEntity reference and add a key deserializer module 
     */
    @OneToMany(mappedBy = "teamScope", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    //@MapKey(name="id")
    @XmlTransient
    private Map<Long, VariableInstanceEntity> teamVariableInstances = new HashMap<Long, VariableInstanceEntity>();

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
     * @param userId
     * @return  
     */
    @Override
    public VariableInstanceEntity getVariableInstance(Long userId) {
        return this.teamVariableInstances.get(userId);
    }

    /**
     * 
     * @param userId
     * @param v
     */
    @Override
    public void setVariableInstance(Long userId, VariableInstanceEntity v) {
        this.teamVariableInstances.put(userId, v);
        v.setTeamScope(this);
    }

    /**
     * 
     */
    @PrePersist
    public void prePersist() {
        this.propagateDefaultVariableInstance(false);
    }

    /**
     * 
     */
    @Override
    public void reset() {
        this.propagateDefaultVariableInstance(true);
        //        throw new UnsupportedOperationException("Not supported yet.");
    }

    /**
     * 
     * @param forceUpdate
     */
    @XmlTransient
    //@Transient
    public void propagateDefaultVariableInstance(boolean forceUpdate) {
        VariableDescriptorEntity vd = this.getVariableDescriptor();
        GameModelEntity gm = vd.getGameModel();
        for (TeamEntity t : gm.getTeams()) {
            VariableInstanceEntity vi = this.teamVariableInstances.get(t.getId());

            if (vi == null) {
                this.setVariableInstance(t.getId(), vd.getDefaultVariableInstance().clone());
            } else if (forceUpdate) {
                vi.merge(vd.getDefaultVariableInstance());
            }

        }
    }

    /**
     * 
     * @param a
     */
    @Override
    public void merge(AnonymousEntity a) {
    }
}
