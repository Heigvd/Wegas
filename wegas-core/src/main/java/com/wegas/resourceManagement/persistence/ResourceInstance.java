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
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.*;
import org.codehaus.jackson.annotate.JsonManagedReference;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Access(AccessType.FIELD)
public class ResourceInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    public static final int HISTORYSIZE = 20;
    /**
     *
     */
    @OneToMany(mappedBy = "resourceInstance", cascade = {CascadeType.ALL}, orphanRemoval = true, targetEntity = Assignment.class)
    @JsonManagedReference
    @OrderColumn
    private List<Assignment> assignments;
    /**
     *
     */
    @OneToMany(mappedBy = "resourceInstance", cascade = {CascadeType.ALL}, orphanRemoval = true, targetEntity = Occupation.class)
    @JsonManagedReference
    private List<Occupation> occupations;
    /**
     *
     */
    @OneToMany(mappedBy = "resourceInstance", cascade = {CascadeType.ALL}, orphanRemoval = true, targetEntity = Activity.class)
    @JsonManagedReference
    private List<Activity> activities;
    /**
     *
     */
    private boolean active = true;
    /**
     *
     */
    @ElementCollection
    private Map<String, Long> skillsets = new HashMap<>();
    /**
     *
     */
    @ElementCollection
    private Map<String, String> properties = new HashMap<>();
    /**
     *
     */
    private int moral;
    /**
     *
     */
    @ElementCollection
    @Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
    private List<Integer> moralHistory = new ArrayList<>();
    /**
     *
     */
    private int confidence;
    /**
     *
     */
    @ElementCollection
    @Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
    private List<Integer> confidenceHistory = new ArrayList<>();

    public ResourceInstance() {
        this.assignments = new ArrayList<>();
        this.activities = new ArrayList<>();
        this.occupations = new ArrayList<>();
    }

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
            this.setOccupations(other.getOccupations());
        }
        this.skillsets.clear();
        this.skillsets.putAll(other.getSkillsets());
        this.properties.clear();
        this.properties.putAll(other.getProperties());
        this.setMoral(other.getMoral());
        this.setConfidence(other.getConfidence());
    }

    @PreUpdate
    public void preUpdate() {
        this.stepHistory();
    }

    public void stepHistory() {
        capAdd(moral, moralHistory);
        capAdd(confidence, confidenceHistory);
    }

    public static void capAdd(Object el, List target) {
        target.add(el);
        if (target.size() > HISTORYSIZE) {
            target.remove(0);
        }
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
     * @param activities
     */
    public void addActivity(Activity activity) {
        activities.add(activity);
        activity.setResourceInstance(this);
    }
    
    /**
     *
     * @param activities
     */
    public void removeActivity(Activity activity) {
        if (activity.getId() == null){
            for (int i=0; i<this.activities.size(); i++){
                if (this.activities.get(i) == activity){
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
        occupations.add(occupation);
        occupation.setResourceInstance(this);
    }

    /**
     *
     * @param occupation
     */
    public Occupation addOccupation() {
        Occupation occupation = new Occupation();
        this.addOccupation(occupation);
        return occupation;
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
     * @return the skillset
     */
    public Map<String, Long> getSkillsets() {
        return this.skillsets;
    }

    /**
     * @param skillset the skillset to set
     */
    public void setSkillsets(Map<String, Long> skillsets) {
        this.skillsets = skillsets;
    }

    /**
     *
     * @param key
     * @param val
     */
    public void setSkillset(String key, Long val) {
        this.skillsets.put(key, val);
    }

    /**
     *
     * @param key
     * @return
     */
    public Long getSkillset(String key) {
        return this.skillsets.get(key);
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
     * @return the moral
     */
    public Integer getMoral() {
        return this.moral;
    }

    /**
     * Set the confidence's value and add old confidence value in
     * confidenceHistorique.
     *
     * @param moral the moral to set
     */
    public void setMoral(Integer moral) {
        this.moral = moral;
        this.moralHistory.add(moral);
    }

    /**
     * @return the moralHistory
     */
    public List<Integer> getMoralHistory() {
        return this.moralHistory;
    }

    /**
     * @param moralHistory the moralHistory to set
     */
    public void setMoralHistory(List<Integer> moralHistory) {
        this.moralHistory = moralHistory;
    }

    /**
     * @param ref a index value corresponding to a value
     * @return the value corresponding at the 'ref' param in the moralHistory
     */
    public Integer getMoralHistory(Integer ref) {
        return this.moralHistory.get(ref);
    }

    /**
     * @param ref a index value corresponding to a value
     * @param value the new value
     */
    public void setMoralHistory(Integer ref, Integer value) {
        this.moralHistory.set(ref, value);
    }

    /**
     * @return the confidence
     */
    public Integer getConfidence() {
        return this.confidence;
    }

    /**
     * Set the confidence's value and add confidence value in
     * confidenceHistorique.
     *
     * @param confidence the confidence to set
     */
    public void setConfidence(Integer confidence) {
        this.confidence = confidence;
    }

    /**
     * @return the confidenceHistoric
     */
    public List<Integer> getConfidenceHistory() {
        return this.confidenceHistory;
    }

    /**
     * @param confidenceHistory the confidenceHistory to set
     */
    public void setConfidenceHistory(List<Integer> confidenceHistory) {
        this.confidenceHistory = confidenceHistory;
    }

    /**
     * @param ref a index value corresponding to a value
     * @return the value corresponding at the 'ref' param in the
     * confidenceHistory
     */
    public Integer getConfidenceHistory(Integer ref) {
        return this.confidenceHistory.get(ref);
    }

    /**
     * @param ref a index value corresponding to a value
     * @param value the new value
     */
    public void setConfidenceHistory(Integer ref, Integer value) {
        this.confidenceHistory.set(ref, value);
    }

    public List<Assignment> moveAssignemnt(Integer currentPosition, Integer nextPosition) {
        Assignment assignment = this.assignments.remove(currentPosition.intValue());
        this.assignments.add(nextPosition.intValue(), assignment);
        return this.assignments;
    }
}
