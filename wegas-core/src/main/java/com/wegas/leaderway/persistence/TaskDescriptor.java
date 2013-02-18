/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.ManyToMany;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 *
 */
@Entity
public class TaskDescriptor extends VariableDescriptor<TaskInstance> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    private String description;
    /**
     *
     */
    private Integer index;
    /**
     *
     */
    @ElementCollection
    private Map<String, String> properties = new HashMap<>();
    /**
     *
     */
    @ElementCollection
    @ManyToMany(cascade = {})
    private List<TaskDescriptor> predecessors = new ArrayList<>();
    /**
     *
     */
    @ElementCollection
    private Map<String, WRequirement> requierements = new HashMap<>();
    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        TaskDescriptor other = (TaskDescriptor) a;
        this.setDescription(other.getDescription());
        this.setIndex(other.getIndex());
        this.predecessors.addAll(other.getPredecessors());
        this.properties.putAll(other.getProperties());
        this.requierements.clear();
        this.requierements.putAll(other.getRequierements());
    }

    /**
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * @return the index
     */
    public Integer getIndex() {
        return index;
    }

    /**
     * @param index the index to set
     */
    public void setIndex(Integer index) {
        this.index = index;
    }

    /**
     * @return the predecessors
     */
    public List<TaskDescriptor> getPredecessors() {
        return predecessors;
    }

    /**
     * @param predecessors the predecessors to set
     */
    public void setPredecessors(List<TaskDescriptor> predecessors) {
        this.predecessors = predecessors;
    }

    /**
     * @return the predecessors
     */
    public TaskDescriptor getPredecessor(Integer index) {
        return predecessors.get(index);
    }

    /**
     * @param predecessors the predecessors to set
     */
    public void setPredecessor(Integer index, TaskDescriptor taskDescriptor) {
        this.predecessors.set(index, taskDescriptor);
    }
    
    /**
     * @return the requierements
     */
    public Map<String, WRequirement> getRequierements() {
        return this.requierements;
    }

    /**
     * @param requierement the requierement to set
     */
    public void setSkillsets(Map<String, WRequirement> requierement) {
        this.requierements = requierement;
    }

    /**
     *
     * @param key
     * @param WRequirement
     */
    public void setRequierement(String key, WRequirement val) {
        this.requierements.put(key, val);
    }

    /**
     *
     * @param key
     * @return
     */
    public WRequirement getRequierements(String key) {
        return this.requierements.get(key);
    }

    /**
     * @return the properties
     */
    public Map<String, String> getProperties() {
        return properties;
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
}
