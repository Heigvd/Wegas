/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.PreDestroy;
import javax.persistence.Basic;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.Lob;
import javax.persistence.ManyToMany;
import javax.persistence.Transient;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;

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
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
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
    @ManyToMany
    @JoinTable(
            joinColumns = {
                @JoinColumn(name = "taskdescriptor_variabledescriptor_id")},
            inverseJoinColumns = {
                @JoinColumn(name = "predecessors_variabledescriptor_id")})      // prevent change in the db
    @JsonIgnore
    private List<TaskDescriptor> predecessors = new ArrayList<>();
    /*
     *
     */
    @ManyToMany(mappedBy = "predecessors")
    @JsonIgnore
    private List<TaskDescriptor> dependencies = new ArrayList<>();
    /**
     *
     */
    @Transient
    private List<String> predecessorNames = new ArrayList<>();

    /**
     * /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        TaskDescriptor other = (TaskDescriptor) a;
        this.setDescription(other.getDescription());
        this.setIndex(other.getIndex());
        this.predecessors = ListUtils.updateList(this.predecessors, other.getPredecessors());
        this.properties.clear();
        this.properties.putAll(other.getProperties());
    }

    /**
     *
     */
    @PreDestroy
    public void preDestroy() {
        for (TaskDescriptor t : this.dependencies) {
            t.predecessors.remove(this);
        }
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
     * @param index
     * @return the predecessors
     */
    public TaskDescriptor getPredecessor(Integer index) {
        return predecessors.get(index);
    }

    /**
     * @param index
     * @param taskDescriptor
     */
    public void setPredecessor(Integer index, TaskDescriptor taskDescriptor) {
        this.predecessors.set(index, taskDescriptor);
    }

    /**
     * @param taskDescriptor
     */
    public void addPredecessor(final TaskDescriptor taskDescriptor) {
        this.predecessors.add(taskDescriptor);
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

    /**
     *
     * @param key
     * @return
     */
    public double getPropertyD(String key) {
        return Double.valueOf(this.properties.get(key));
    }

    //Methods for impacts
    /**
     *
     * @param p
     * @param key
     * @return
     */
    public double getNumberInstanceProperty(Player p, String key) {
        String value = this.getInstance(p).getProperty(key);
        double parsedValue;
        try {
            parsedValue = Double.parseDouble(value);
        } catch (NumberFormatException e) {
            parsedValue = Double.NaN;
        }
        return parsedValue;
    }

    /**
     *
     * @param p
     * @param key
     * @return
     */
    public String getStringInstanceProperty(Player p, String key) {
        return this.getInstanceProperty(p, key);
    }

    /**
     *
     * @param p
     * @param key
     * @return
     */
    public String getInstanceProperty(Player p, String key) {
        return this.getInstance(p).getProperty(key);
    }

    /**
     *
     * @param p
     * @param key
     * @param value
     */
    public void setInstanceProperty(Player p, String key, String value) {
        this.getInstance(p).setProperty(key, value);
    }

    /**
     *
     * @param p
     * @param key
     * @param value
     */
    public void addNumberAtInstanceProperty(Player p, String key, String value) {
        try {
            this.getInstance(p).setProperty(key, "" + (Float.parseFloat(this.getInstance(p).getProperty(key)) + Float.parseFloat(value)));
        } catch (NumberFormatException e) {
            // do nothing...
        }
    }

    /**
     *
     * @param p
     * @return
     */
    public double getDuration(Player p) {
        return this.getInstance(p).getDuration();
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setDuration(Player p, double value) {
        this.getInstance(p).setDuration(value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void addAtDuration(Player p, double value) {
        TaskInstance instance = this.getInstance(p);
        instance.setDuration(instance.getDuration() + value);
    }

    public WRequirement getRequirementByName(Player p, String name) {
        return this.getInstance(p).getRequirementByName(name);
    }

    /**
     *
     * @param p
     * @param name
     * @param variable
     * @param value
     */
    public void setRequirementVariable(Player p, String name, String variable, double value) {
        WRequirement requirement = this.getRequirementByName(p, name);
        if (requirement != null) {
            requirement.setVariableValue(variable, value);
        }
    }

    /**
     *
     * @param p
     * @param name
     * @param variable
     * @param value
     */
    public void addAtRequirementVariable(Player p, String name, String variable, double value) {
        WRequirement requirement = this.getRequirementByName(p, name);
        if (requirement != null) {
            requirement.addAtVariableValue(variable, value);
        }
    }

    /**
     *
     * @param p
     * @return
     */
    public boolean getActive(Player p) {
        TaskInstance instance = this.getInstance(p);
        return instance.getActive();
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setActive(Player p, boolean value) {
        TaskInstance instance = this.getInstance(p);
        instance.setActive(value);
    }

    /**
     *
     * @param p
     */
    public void activate(Player p) {
        this.setActive(p, true);
    }

    /**
     *
     * @param p
     */
    public void desactivate(Player p) {
        this.setActive(p, false);
    }

    /**
     * @return the exportedPredecessors
     */
    public List<String> getPredecessorNames() {
        List<String> names = new ArrayList<>();
        for (TaskDescriptor t : this.getPredecessors()) {
            names.add(t.getName());
        }
        return names;
    }

    /**
     *
     * @return
     */
    @JsonIgnore
    public List<String> getImportedPredecessorNames() {
        return this.predecessorNames;
    }

    /**
     * @param exportedPredecessors the exportedPredecessors to set
     */
    public void setPredecessorNames(List<String> exportedPredecessors) {
        this.predecessorNames = exportedPredecessors;
    }
}
