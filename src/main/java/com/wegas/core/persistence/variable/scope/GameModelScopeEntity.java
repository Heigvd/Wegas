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
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToOne;
import javax.persistence.PrePersist;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "GameModelScope", propOrder = {"@class", "id", "name"})
public class GameModelScopeEntity extends AbstractScopeEntity {


    private static final Logger logger = LoggerFactory.getLogger(GameModelScopeEntity.class);
    /**
     *
     */
    @OneToOne(cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    @XmlTransient
    private VariableInstanceEntity variableInstance;

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
    @XmlTransient
    public void propagateDefaultInstance(boolean force) {
        VariableDescriptorEntity vd = this.getVariableDescriptor();
        VariableInstanceEntity vi = this.getVariableInstance();
        if (vi == null) {
            this.setVariableInstance(new Long("0"), vd.getDefaultVariableInstance().clone());
        } else if (force) {
            vi.merge(vd.getDefaultVariableInstance());
        }
    }

    /**
     *
     * @return
     */
    @Override
    public Map<Long, VariableInstanceEntity> getVariableInstances() {
        Map<Long, VariableInstanceEntity> ret = new HashMap<>();
        ret.put(new Long("0"), getVariableInstance());
        return ret;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
    }

    /**
     *
     * @param player
     * @return
     */
    @Override
    public VariableInstanceEntity getVariableInstance(PlayerEntity player) {
        return this.variableInstance;
    }

    /**
     *
     * @param userId
     * @param v
     */
    @Override
    public void setVariableInstance(Long userId, VariableInstanceEntity v) {
        this.setVariableInstance(v);
        v.setScope(this);
    }

    /**
     * @return the variableInstance
     */
    @XmlTransient
    public VariableInstanceEntity getVariableInstance() {
        return variableInstance;
    }

    /**
     * @param variableInstance the variableInstance to set
     */
    @XmlTransient
    public void setVariableInstance(VariableInstanceEntity variableInstance) {
        this.variableInstance = variableInstance;
    }
}
