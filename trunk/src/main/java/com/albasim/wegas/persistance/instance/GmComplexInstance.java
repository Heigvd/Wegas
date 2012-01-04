/*
 * MetAlbasim is super koool. http://www.albasim.com
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 *
 * MetAlbasim is distributed under the ??? license
 *
 */
package com.albasim.wegas.persistance.instance;

import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.helper.VariableInstanceIndexEntry;
import com.albasim.wegas.persistance.GmEventListener;
import com.albasim.wegas.persistance.GmInstance;
import com.albasim.wegas.persistance.GmVariableInstance;
import java.util.Collection;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlRootElement
@XmlType(name = "ComplexI")
public class GmComplexInstance extends GmInstance {

    private boolean active; // main on/off switch


    @XmlElement(name = "condition")
    private String cond; // conditional on/off switch


    @OneToMany(mappedBy = "gmComplexInstance", cascade = {CascadeType.REMOVE, CascadeType.PERSIST})
    private List<GmEventListener> listeners;


    @OneToMany(mappedBy = "parentComplexInstance", cascade = {CascadeType.REMOVE, CascadeType.PERSIST})
    @XmlTransient
    private List<GmVariableInstance> variableInstances;


    public boolean isActive() {
        return active;
    }


    public void setActive(boolean active) {
        this.active = active;
    }


    public String getCond() {
        return cond;
    }


    public void setCond(String cond) {
        this.cond = cond;
    }


    public Collection<VariableInstanceIndexEntry> getVariableIndex() {
        return AlbaHelper.getVariableInstanceIndex(variableInstances);
    }


    @XmlTransient
    public List<GmVariableInstance> getVariableInstances() {
        return variableInstances;
    }


    public void setVariableInstances(
            List<GmVariableInstance> variableInstances) {
        this.variableInstances = variableInstances;
    }


    @XmlTransient
    public List<GmEventListener> getListeners() {
        return listeners;
    }


    @XmlTransient
    public void setListeners(List<GmEventListener> listeners) {
        this.listeners = listeners;
    }

    public GmVariableInstance lookupVariableInstance(String varName) {
        if (variableInstances != null) {
            for (GmVariableInstance vi : this.variableInstances) {
                if (vi.getName().equals(varName)) {
                    return vi;
                }
            }
        }
        return null;
    }


}
