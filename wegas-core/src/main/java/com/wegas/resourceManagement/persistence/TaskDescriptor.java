/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.AbstractEntity;
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
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.resourceManagement.ejb.IterationFacade;
import java.util.Iterator;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.OneToMany;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 *
 */
@Entity
public class TaskDescriptor extends VariableDescriptor<TaskInstance> {

    private static final Logger logger = LoggerFactory.getLogger(TaskDescriptor.class);

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
    @Column(length = 24)
    private String index;
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
    private List<String> predecessorNames/* = new ArrayList<>()*/;

    @OneToMany(mappedBy = "taskDescriptor", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference
    @JsonIgnore
    private List<Activity> activities = new ArrayList<>();

    @OneToMany(mappedBy = "taskDescriptor", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference
    @JsonIgnore
    private List<Assignment> assignments = new ArrayList<>();

    @ManyToMany(mappedBy = "tasks")
    @JsonView(Views.ExtendedI.class)
    private List<Iteration> iterations;

    /**
     *
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof TaskDescriptor) {
            super.merge(a);
            TaskDescriptor other = (TaskDescriptor) a;
            this.setDescription(other.getDescription());
            this.setIndex(other.getIndex());
            this.setPredecessorNames(other.getImportedPredecessorNames());
            // this.setPredecessors(ListUtils.updateList(this.getPredecessors(), other.getPredecessors()));
            this.setProperties(new HashMap<>());
            this.getProperties().putAll(other.getProperties());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
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
    public String getIndex() {
        return index;
    }

    /**
     * @param index the index to set
     */
    public void setIndex(String index) {
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
        taskDescriptor.dependencies.add(this);
    }

    /**
     * @param taskDescriptor
     */
    public void removePredecessor(final TaskDescriptor taskDescriptor) {
        this.predecessors.remove(taskDescriptor);
    }

    public List<TaskDescriptor> getDependencies() {
        return dependencies;
    }

    /**
     * @param taskDescriptor
     */
    public void removeDependency(final TaskDescriptor taskDescriptor) {
        this.dependencies.remove(taskDescriptor);
    }

    /**
     *
     * @return
     */
    @JsonIgnore
    public List<Iteration> getIterations() {
        return iterations;
    }

    /**
     *
     * @param iterations
     */
    @JsonIgnore
    public void setIterations(List<Iteration> iterations) {
        this.iterations = iterations;
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
            TaskInstance instance = this.getInstance(p);
            double oldValue = instance.getPropertyD(key);
            double newValue = oldValue + Double.parseDouble(value);
            instance.setProperty(key, "" + newValue);
        } catch (NumberFormatException e) {
            // do nothing...
        }
    }

    /**
     *
     * @deprecated moved as property
     * @param p
     * @return
     */
    public double getDuration(Player p) {
        return this.getInstance(p).getPropertyD("duration");
    }

    /**
     *
     * @deprecated moved as property
     * @param p
     * @param value
     */
    public void setDuration(Player p, double value) {
        this.getInstance(p).setProperty("duration", Double.toString(value));
    }

    /**
     *
     * @deprecated moved as property
     * @param p
     * @param value
     */
    public void addAtDuration(Player p, double value) {
        TaskInstance instance = this.getInstance(p);
        double v = instance.getPropertyD("duration") + value;
        instance.setProperty("duration", Double.toString(v));
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

    /**
     * @return the activities
     */
    public List<Activity> getActivities() {
        return activities;
    }

    /**
     * @param activities
     */
    public void setActivities(List<Activity> activities) {
        this.activities = activities;
    }

    /**
     *
     * @param activity
     */
    public void addActivity(Activity activity) {
        this.activities.add(activity);
        activity.setTaskDescriptor(this);
    }

    /**
     *
     * @param activity
     */
    public void removeActivity(Activity activity) {
        this.activities.remove(activity);
    }

    /**
     * @return the assignments
     */
    public List<Assignment> getAssignments() {
        return assignments;
    }

    /**
     * @param assignments
     */
    public void setAssignments(List<Assignment> assignments) {
        this.assignments = assignments;
    }

    /**
     *
     * @param assignment
     */
    public void addAssignment(Assignment assignment) {
        assignments.add(assignment);
        assignment.setTaskDescriptor(this);
    }

    public void removeAssignment(Assignment assignment) {
        assignments.remove(assignment);
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        return Helper.insensitiveContainsAll(this.getDescription(), criterias)
            || super.containsAll(criterias);
    }

    @Override
    public void updateCacheOnDelete() {
        VariableDescriptorFacade vdf = VariableDescriptorFacade.lookup();
        IterationFacade iteF = IterationFacade.lookup();

        for (TaskDescriptor theTask : this.dependencies) {
            theTask = (TaskDescriptor) vdf.find(theTask.getId());
            if (theTask != null) {
                theTask.removePredecessor(this);
            }
        }
        this.dependencies = new ArrayList<>();

        for (TaskDescriptor theTask : this.predecessors) {
            theTask = (TaskDescriptor) vdf.find(theTask.getId());
            if (theTask != null) {
                theTask.removeDependency(this);
            }
        }
        this.setPredecessors(new ArrayList<>());

        for (Iteration iteration : this.getIterations()) {
            iteration = iteF.find(iteration.getId());
            if (iteration != null) {
                iteration.removeTask(this);
            }
        }
        this.setIterations(new ArrayList<>());

        super.updateCacheOnDelete();
    }
}
