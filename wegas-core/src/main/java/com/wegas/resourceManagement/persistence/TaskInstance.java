/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.CascadeType;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class TaskInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    private boolean active = true;
    /**
     *
     */
    private double duration;
    /**
     *
     */
    @ElementCollection
    private List<Integer> plannification = new ArrayList<>();
    /**
     *
     */
    @ElementCollection
    private Map<String, String> properties = new HashMap<>();
    /**
     *
     */
    @OneToMany(cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JoinColumn(referencedColumnName = "variableinstance_id", updatable = true, insertable = true)
    private List<WRequirement> requirements = new ArrayList<>();

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        TaskInstance other = (TaskInstance) a;
        this.setActive(other.getActive());
        this.setDuration(other.getDuration());
        this.properties.clear();
        this.properties.putAll(other.getProperties());
        this.requirements.clear();
        for (WRequirement req : other.getRequirements()) {
            //if (req.getId() != null) { //don't like modification
            WRequirement r = new WRequirement();
            r.merge(req);
            this.requirements.add(r);
        }
        //}
        this.plannification.clear();
        this.plannification.addAll(other.getPlannification());
    }

    /**
     * @return the active
     */
    public boolean getActive() {
        return this.active;
    }

    /**
     * @param active the active to set
     */
    public void setActive(boolean active) {
        this.active = active;
    }

    /**
     * @return the duration
     */
    public double getDuration() {
        return duration;
    }

    /**
     * @param duration the duration to set
     */
    public void setDuration(double duration) {
        this.duration = duration;
    }

    /**
     * @return the properties
     */
    public Map<String, String> getProperties() {
        return this.properties;
    }

    /**
     * @param properties the properties to set
     */
    public void setProperties(Map<String, String> properties) {
        this.properties = properties;
    }

    /**
     *
     * @param key
     * @param val
     */
    public void setProperty(String key, String val) {
        this.properties.put(key, val);
    }

    /**
     *
     * @param key
     * @return
     */
    public String getProperty(String key) {
        return this.properties.get(key);
    }

    /**
     * @return the requirements
     */
    public List<WRequirement> getRequirements() {
        return this.requirements;
    }

    /**
     * @param requierement the requierement to set
     */
    public void setRequirements(List<WRequirement> requirements) {
        this.requirements = requirements;
    }

    /**
     *
     * @param key
     * @return WRequirement
     */
    public WRequirement getRequirement(Integer index) {
        return this.requirements.get(index);
    }

    /**
     *
     * @param key
     * @param WRequirement
     */
    public void setRequirement(Integer index, WRequirement val) {
        this.requirements.set(index, val);
    }

    /**
     * @return the plannification
     */
    public List<Integer> getPlannification() {
        return plannification;
    }

    /**
     * @param plannification the plannification to set
     */
    public void setPlannification(List<Integer> plannification) {
        this.plannification = plannification;
    }

    /**
     * 
     * @param id
     * @return 
     */
    public WRequirement getRequirementById(Long id) {
        WRequirement requirement = null;
        for (WRequirement req : this.getRequirements()) {
            if (req.getId().longValue() == id.longValue()) {
                requirement = req;
                break;
            }
        }
        return requirement;
    }
}
