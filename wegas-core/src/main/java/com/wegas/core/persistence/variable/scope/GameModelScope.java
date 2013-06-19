/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
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
public class GameModelScope extends AbstractScope {


    private static final Logger logger = LoggerFactory.getLogger(GameModelScope.class);
    /**
     *
     */
    @OneToOne(cascade = {CascadeType.PERSIST, CascadeType.REMOVE}, orphanRemoval = true)
    @XmlTransient
    private VariableInstance variableInstance;

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
        VariableDescriptor vd = this.getVariableDescriptor();
        VariableInstance vi = this.getVariableInstance();
        if (vi == null) {
            this.setVariableInstance(Long.valueOf(0), vd.getDefaultInstance().clone());
        } else if (force) {
            vi.merge(vd.getDefaultInstance());
        }
    }

    /**
     *
     * @return
     */
    @Override
    public Map<Long, VariableInstance> getVariableInstances() {
        Map<Long, VariableInstance> ret = new HashMap<Long, VariableInstance>();
        ret.put(Long.valueOf("0"), getVariableInstance());
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
    public VariableInstance getVariableInstance(Player player) {
        return this.variableInstance;
    }

    /**
     *
     * @param userId
     * @param v
     */
    @Override
    public void setVariableInstance(Long userId, VariableInstance v) {
        this.setVariableInstance(v);
//        v.setScope(this); @fixme @fixme
    }

    /**
     * @return the variableInstance
     */
    @XmlTransient
    public VariableInstance getVariableInstance() {
        return variableInstance;
    }

    /**
     * @param variableInstance the variableInstance to set
     */
    @XmlTransient
    public void setVariableInstance(VariableInstance variableInstance) {
        this.variableInstance = variableInstance;
    }
}
