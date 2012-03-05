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

import com.wegas.persistence.game.AbstractEntity;
import com.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.wegas.persistence.variableinstance.VariableInstanceEntity;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToOne;
import javax.persistence.PrePersist;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "GameModelScope", propOrder = {"@class", "id", "name"})
public class GameModelScopeEntity extends ScopeEntity {

    private static final Logger logger = Logger.getLogger(GameModelScopeEntity.class.getName());
    /*
     * FIXME Here we should use TeamEntity reference and add a key deserializer module 
     */
    @OneToOne(mappedBy = "gameModelScope", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    //@MapKey(name="id")
    @XmlTransient
    private VariableInstanceEntity variableInstance;

    /**
     * 
     */
    @PrePersist
    public void prePersist() {
        this.propagateDefaultVariableInstance(false);
    }

    /**
     * 
     * @param force 
     */
    @Override
    @XmlTransient
    public void propagateDefaultVariableInstance(boolean force) {
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
        Map<Long, VariableInstanceEntity> ret = new HashMap<Long, VariableInstanceEntity>();
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
     * @param userId
     * @return  
     */
    @Override
    public VariableInstanceEntity getVariableInstance(Long userId) {
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
        v.setGameModelScope(this);
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
