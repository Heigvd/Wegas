/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.persistence;

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
    private Boolean active = true;
    /**
     *
     */
    private Integer duration;
    /**
     *
     */
    @ElementCollection
    private Map<String, String> properties = new HashMap<>();
    /**
     *
     */
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(referencedColumnName = "variableinstance_id")
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
        this.requirements.addAll(other.getRequirements());
    }

    /**
     * @return the active
     */
    public Boolean getActive() {
        return this.active;
    }

    /**
     * @param active the active to set
     */
    public void setActive(Boolean active) {
        this.active = active;
    }

    /**
     * @return the duration
     */
    public Integer getDuration() {
        return duration;
    }

    /**
     * @param duration the duration to set
     */
    public void setDuration(Integer duration) {
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
}
