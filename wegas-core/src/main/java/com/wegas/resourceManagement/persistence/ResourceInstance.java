/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Access(AccessType.FIELD)
@JsonIgnoreProperties({"moralHistory", "confidenceHistory"})
/*@Table(indexes = {
    @Index(columnList = "properties.resourceinstance_variableinstance_id")
})*/
public class ResourceInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToMany(mappedBy = "resourceInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference
    @OrderColumn
    private List<Assignment> assignments = new ArrayList<>();
    /**
     *
     */
    @OneToMany(mappedBy = "resourceInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference
    private List<Occupation> occupations = new ArrayList<>();
    /**
     *
     */
    @OneToMany(mappedBy = "resourceInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference
    private List<Activity> activities = new ArrayList<>();
    /**
     *
     */
    private boolean active = true;
    /**
     *
     */
    @Transient
    private Map<String, Long> skillsets;
    /**
     *
     */
    @ElementCollection
    private Map<String, String> properties = new HashMap<>();
    /**
     *
     */
    @Transient
    private Integer moral;
    /**
     *
     */
    private int confidence;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        ResourceInstance other = (ResourceInstance) a;
        this.setActive(other.getActive());
        if (other.getAssignments() != null) {
            this.setAssignments(other.getAssignments());
        }
        if (other.getActivities() != null) {
            this.setActivities(other.getActivities());
        }
        if (other.getOccupations() != null) {
            this.occupations.clear();
            for (Occupation occ : other.getOccupations()) {
                Occupation o = new Occupation();
                o.merge(occ);
                o.setResourceInstance(this);
                this.occupations.add(o);
            }
        }
        this.properties.clear();
        this.properties.putAll(other.getProperties());
        //this.setMoral(other.getMoral());
        this.setConfidence(other.getConfidence());
    }

    /**
     * @return the assignements
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
    public void addAssignement(Assignment assignment) {
        assignments.add(assignment);
        assignment.setResourceInstance(this);
    }

    /**
     *
     * @param task
     * @return
     */
    public Assignment assign(TaskDescriptor task) {
        final Assignment assignment = new Assignment(task);
        this.addAssignement(assignment);
        return assignment;
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
        activities.add(activity);
        activity.setResourceInstance(this);
    }

    /**
     *
     * @param activity
     */
    public void removeActivity(Activity activity) {
        if (activity.getId() == null) {
            for (int i = 0; i < this.activities.size(); i++) {
                if (this.activities.get(i) == activity) {
                    this.activities.remove(i);
                }
            }
        } else {
            activities.remove(activity);
        }
    }

    /**
     *
     * @param task
     * @return the activity
     */
    public Activity createActivity(TaskDescriptor task) {
        final Activity activity = new Activity(task);
        this.addActivity(activity);
        return activity;
    }

    /**
     * @return the activities
     */
    public List<Occupation> getOccupations() {
        return occupations;
    }

    private Occupation getOccupation(double time) {
        for (Occupation o : getOccupations()) {
            if (Math.abs(o.getTime() - time) < 0.000001) {
                return o;
            }
        }
        return null;
    }

    /**
     * @param occupations
     */
    public void setOccupations(List<Occupation> occupations) {
        this.occupations = occupations;
    }

    /**
     *
     * @param occupation
     */
    public void addOccupation(Occupation occupation) {
        Occupation o = getOccupation(occupation.getTime());
        // #789 & #788 prevent having several occupation for the same time
        if (o != null) {
            occupations.remove(o);
        }

        occupations.add(occupation);
        occupation.setResourceInstance(this);
    }

    /**
     *
     * @return
     */
    public Occupation addOccupation() {
        Occupation occupation = new Occupation();
        this.addOccupation(occupation);
        return occupation;
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
     * @deprecated @return the skillset
     */
    @JsonIgnore
    public Map<String, Long> getDeserializedSkillsets() {
        return this.skillsets;
    }

    /**
     * @deprecated @param skillsets
     */
    public void setSkillsets(Map<String, Long> skillsets) {
        this.skillsets = skillsets;
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
     *
     * @param key
     * @return
     */
    public double getPropertyD(String key) {
        return Double.valueOf(this.properties.get(key));
    }

    /**
     * @return the moral
     * @deprecated
     */
    @JsonIgnore
    public Integer getMoral() {
        return this.moral;
    }

    /**
     * @param moral the moral to set
     * @deprecated
     */
    @JsonProperty
    public void setMoral(int moral) {
        this.moral = moral;
    }

    /**
     * @return the confidence
     */
    public int getConfidence() {
        return this.confidence;
    }

    /**
     * Set the confidence's value
     *
     * @param confidence the confidence to set
     */
    public void setConfidence(int confidence) {
        this.confidence = confidence;
    }

    /**
     *
     * @param currentPosition
     * @param nextPosition
     * @return
     */
    public List<Assignment> moveAssignemnt(Integer currentPosition, Integer nextPosition) {
        Assignment assignment = this.assignments.remove(currentPosition.intValue());
        this.assignments.add(nextPosition, assignment);
        return this.assignments;
    }
}
