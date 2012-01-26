/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.persistence.scope;

import com.albasim.wegas.persistence.GameModelEntity;
import com.albasim.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.albasim.wegas.persistence.variableinstance.VariableInstanceEntity;
import java.util.HashMap;
import java.util.Map;
import java.util.logging.Level;
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

@XmlType(name = "GameScope", propOrder = {"@class", "id", "name"})
public class GameScopeEntity extends ScopeEntity {

    private static final Logger logger = Logger.getLogger(GameScopeEntity.class.getName());
    /*
     * FIXME Here we should use TeamEntity reference and add a key deserializer module 
     */
    @OneToOne(mappedBy = "gameScope", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    //@MapKey(name="id")
    @XmlTransient
    private VariableInstanceEntity variableInstance;

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
     * @param userId
     * @param v
     */
    @Override
    public void setVariableInstances(Long userId, VariableInstanceEntity v) {
        this.setVariableInstance(v);
        v.setGameScope(this);
    }

    /**
     * 
     */
    @PrePersist
    public void prePersist() {
        VariableDescriptorEntity vd = this.getVariableDescriptor();
        GameModelEntity gm = vd.getGameModel();
        VariableInstanceEntity newVi;
        try {
            newVi = (VariableInstanceEntity) vd.getDefaultVariableInstance().clone();
            this.setVariableInstances(new Long(0), newVi);
        } catch (CloneNotSupportedException ex) {
            Logger.getLogger(GameScopeEntity.class.getName()).log(Level.SEVERE, null, ex);
        }
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
