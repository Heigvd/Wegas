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
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonView;

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
        @JoinColumn(name = "predecessors_variabledescriptor_id")})              // prevent change in the db
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
        this.predecessors = ListUtils.mergeLists(this.predecessors, other.getPredecessors());
        this.properties.clear();
        this.properties.putAll(other.getProperties());
    }

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
     * @param predecessors the predecessors to set
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
     * @param value
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

    /**
     *
     * @param p
     * @param id
     * @param variable
     * @return
     */
    public double getRequirementVariable(Player p, Long id, String variable) {
        WRequirement requirement = this.getRequirementById(p, id);
        double value = Double.NaN;
        if (requirement != null) {
            value = requirement.getVariableValue(variable);
        }
        return value;
    }

    /**
     *
     * @param p
     * @param id
     * @return
     */
    public WRequirement getRequirementById(Player p, Long id) {
        return this.getInstance(p).getRequirementById(id);
    }

    /**
     *
     * @param p
     * @param id
     * @param variable
     * @param value
     */
    public void setRequirementVariable(Player p, Long id, String variable, double value) {
        WRequirement requirement = this.getRequirementById(p, id);
        if (requirement != null) {
            requirement.setVariableValue(variable, value);
        }
    }

    /**
     *
     */
    public void addAtRequirementVariable(Player p, Long id, String variable, double value) {
        WRequirement requirement = this.getRequirementById(p, id);
        if (requirement != null) {
            requirement.addAtVariableValue(variable, value);
        }
    }

    /**
     *
     * @param p
     */
    public void getActive(Player p) {
        TaskInstance instance = this.getInstance(p);
        instance.getActive();
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
