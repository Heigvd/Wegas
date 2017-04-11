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
import java.util.List;
import java.util.Map;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.variable.Propertable;
import com.wegas.core.persistence.VariableProperty;
import java.util.Collections;
import java.util.Comparator;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Access(AccessType.FIELD)
@JsonIgnoreProperties({"moralHistory", "confidenceHistory"})
/*@Table(indexes = {
    @Index(columnList = "properties.resourceinstance_variableinstance_id")
})*/
public class ResourceInstance extends VariableInstance implements Propertable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToMany(mappedBy = "resourceInstance", cascade = {CascadeType.ALL}/*, orphanRemoval = true*/)
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
     * @deprecated
     */
    @Transient
    private Map<String, Long> skillsets;
    /**
     *
     */
    @ElementCollection
    @JsonIgnore
    private List<VariableProperty> properties = new ArrayList<>();
    /**
     * @deprecated
     */
    @Transient
    private Integer moral;
    /**
     *
     */
    private int confidence;

    @JsonIgnore
    @Override
    public List<VariableProperty> getInternalProperties() {
        return properties;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof ResourceInstance) {
            ResourceInstance other = (ResourceInstance) a;
            super.merge(a);
            this.setActive(other.getActive());
            if (other.getAssignments() != null) {
                //ListUtils.mergeLists(this.getAssignments(), other.getAssignments());
                this.setAssignments(
                        ListUtils.mergeLists(this.getAssignments(), other.getAssignments(), new ListUtils.Updater() {
                            @Override
                            public void addEntity(AbstractEntity entity) {
                                if (entity instanceof Assignment) {
                                    Assignment assignment = (Assignment) entity;
                                    TaskDescriptor parent = (TaskDescriptor) VariableDescriptorFacade.lookup().find(assignment.getTaskDescriptorId());
                                    if (parent == null) {
                                        parent = assignment.getTaskDescriptor();
                                    }
                                    parent.addAssignment(assignment);
                                }
                            }

                            @Override
                            public void removeEntity(AbstractEntity entity) {
                                if (entity instanceof Assignment) {
                                    Assignment assignment = (Assignment) entity;
                                    TaskDescriptor parent = (TaskDescriptor) VariableDescriptorFacade.lookup().find(assignment.getTaskDescriptorId());
                                    if (parent != null) {
                                        parent.removeAssignment(assignment);
                                    }
                                }
                            }
                        }));
            }
            if (other.getActivities() != null) {
                this.setActivities(ListUtils.mergeLists(this.getActivities(), other.getActivities(), new ListUtils.Updater() {
                    @Override
                    public void addEntity(AbstractEntity entity) {
                        Activity activity = (Activity) entity;
                        TaskDescriptor tdParent = (TaskDescriptor) VariableDescriptorFacade.lookup().find(activity.getTaskDescriptorId());
                        if (tdParent != null) {
                            tdParent.addActivity(activity);
                        }
                        activity.getRequirement().addActivity(activity);
                    }

                    @Override
                    public void removeEntity(AbstractEntity entity) {
                        Activity activity = (Activity) entity;
                        TaskDescriptor tdParent = (TaskDescriptor) VariableDescriptorFacade.lookup().find(activity.getTaskDescriptorId());
                        if (tdParent != null) {
                            tdParent.removeActivity(activity);
                        }
                        activity.getRequirement().removeActivity(activity);
                    }
                }));
            }
            if (other.getOccupations() != null) {
                //this.setOccupations(ListUtils.mergeLists(this.getOccupations(), other.getOccupations(), new UpdaterImpl(this)));
                this.setOccupations(ListUtils.mergeLists(this.getOccupations(), other.getOccupations()));
            }
            this.setProperties(other.getProperties());
            //this.setProperties(other.getProperties());
            //this.setMoral(other.getMoral());
            this.setConfidence(other.getConfidence());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
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
        assignment.setResourceInstance(this);
    }

    public void removeAssignment(Assignment assignment) {
        assignments.remove(assignment);
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
            // ??
            for (int i = 0; i < this.activities.size(); i++) {
                if (this.activities.get(i) == activity) {
                    activity.setResourceInstance(null);
                    this.activities.remove(i);

                }
            }
        } else if (activities.remove(activity)) {
            activity.setResourceInstance(null);
        }
    }

    /**
     *
     * @param task
     *
     * @return the activity public Activity createActivity(TaskDescriptor task)
     *         { final Activity activity = new Activity(task);
     *         this.addActivity(activity); return activity; }
     */
    /**
     * @return the activities
     */
    public List<Occupation> getOccupations() {
        Collections.sort(this.occupations, new Comparator<Occupation>() {
            @Override
            public int compare(Occupation a, Occupation b) {
                return ((Double) a.getTime()).compareTo(b.getTime());
            }
        });
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
        for (Occupation o : this.occupations) {
            o.setResourceInstance(this);
        }
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

    public void removeOccupation(Occupation occupation) {
        this.getOccupations().remove(occupation);
    }

    /**
     *
     * @return public Occupation addOccupation() { Occupation occupation = new
     *         Occupation(); this.addOccupation(occupation); return occupation;
     *         }
     */
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
     * @return the moral
     *
     * @deprecated
     */
    @JsonIgnore
    public Integer getMoral() {
        return this.moral;
    }

    /**
     * @param moral the moral to set
     *
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
     * Set the confidence value
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
     *
     * @return assignment list with up to date order
     *
     * @deprecated
     */
    public List<Assignment> moveAssignemnt(Integer currentPosition, Integer nextPosition) {
        Assignment assignment = this.assignments.remove(currentPosition.intValue());
        this.assignments.add(nextPosition, assignment);
        return this.assignments;
    }

    /*
    private class UpdaterImpl implements ListUtils.Updater {

        private ResourceInstance parent;

        public UpdaterImpl(ResourceInstance parent) {
            this.parent = parent;
        }

        @Override
        public void addEntity(AbstractEntity entity) {
            Occupation o = (Occupation) entity;
            o.setResourceInstance(parent);
        }

        @Override
        public void removeEntity(AbstractEntity entity) {
        } 
    } */
}
