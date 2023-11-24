/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.ADVANCED;
import ch.albasim.wegas.annotations.IMergeable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasCallback;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.wegas.core.Helper;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.VariableProperty;
import com.wegas.core.persistence.variable.Propertable;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.EmptyMap;
import com.wegas.editor.view.HashListView;
import com.wegas.editor.view.Hidden;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.Access;
import jakarta.persistence.AccessType;
import jakarta.persistence.CascadeType;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Access(AccessType.FIELD)
@JsonIgnoreProperties({"moralHistory", "confidenceHistory"})
/*
 * @Table(indexes = {
 * @Index(columnList = "properties.resourceinstance_id")
 * })
 */
public class ResourceInstance extends VariableInstance implements Propertable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToMany(mappedBy = "resourceInstance", cascade = {CascadeType.ALL}/*
     * , orphanRemoval = true
     */)
    @JsonManagedReference
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        callback = ResourceInstanceMergeCallback.class,
        view = @View(label = "", value = Hidden.class))
    private List<Assignment> assignments = new ArrayList<>();
    /**
     *
     */
    @OneToMany(mappedBy = "resourceInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        view = @View(
            label = "Occupations",
            description = "[period]"
        ))
    private List<Occupation> occupations = new ArrayList<>();
    /**
     *
     */
    @OneToMany(mappedBy = "resourceInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        callback = ResourceInstanceMergeCallback.class,
        view = @View(label = "Activities",
            value = Hidden.class
        ))
    private List<Activity> activities = new ArrayList<>();
    /**
     *
     */
    @WegasEntityProperty(view = @View(label = "Active"), nullable = false, optional = false)
    private boolean active = true;
    /**
     *
     */
    @ElementCollection
    @JsonIgnore
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyMap.class,
        view = @View(label = "Instance properties", featureLevel = ADVANCED, value = HashListView.class))
    private List<VariableProperty> properties = new ArrayList<>();
    /**
     *
     */
    @WegasEntityProperty(view = @View(label = "Confidence", value = Hidden.class))
    private int confidence;

    @JsonIgnore
    @Override
    public List<VariableProperty> getInternalProperties() {
        return properties;
    }

    /**
     * @return the assignments
     */
    public List<Assignment> getAssignments() {
        return Helper.copyAndSortModifiable(this.assignments, new EntityComparators.OrderComparator<>());
    }

    @JsonIgnore
    public List<Assignment> getRawAssignments() {
        return assignments;
    }

    /**
     * @param assignments
     */
    public void setAssignments(List<Assignment> assignments) {
        if (assignments != null) {
            int i = 0;
            for (Assignment assignment : assignments) {
                assignment.setResourceInstance(this);
                assignment.setIndex(i++);
            }
        }
        this.assignments = assignments;
    }

    public void moveAssignment(Assignment assignment, final int index) {
        this.getRawAssignments().remove(assignment);
        List<Assignment> items = this.getAssignments();

        items.add(index, assignment);

        this.getRawAssignments().add(assignment);

        int i =0;
        for (Assignment a : items) {
            a.setResourceInstance(this);
            a.setIndex(i++);
        }
        //this.setAssignments(items);
    }

    /**
     *
     * @param assignment
     */
    public void addAssignment(Assignment assignment) {
        // get the sorted copy
        List<Assignment> items = this.getAssignments();
        items.add(assignment);

        // set the new list to recompute indexes
        this.setAssignments(items);
    }

    public void addAssignment(Assignment assignment, final int index) {
        List<Assignment> items = this.getAssignments();
        // add assignment at the correct possition
        items.add(index, assignment);

        // set the new list to recompute indexes
        this.setAssignments(items);
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
        for (Activity activity : activities) {
            activity.setResourceInstance(this);
        }
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
     * @return the activity public Activity createActivity(TaskDescriptor task) { final Activity
     *         activity = new Activity(task); this.addActivity(activity); return activity; }
     */
    /**
     * @return the activities
     */
    public List<Occupation> getOccupations() {
        return occupations;
        /*Collections.sort(this.occupations, new Comparator<Occupation>() {
            @Override
            public int compare(Occupation a, Occupation b) {
                return ((Double) a.getTime()).compareTo(b.getTime());
            }
        });
        return occupations;*/
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
     * @return public Occupation addOccupation() { Occupation occupation = new Occupation();
     *         this.addOccupation(occupation); return occupation; }
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
     * @return the confidence
     *
     * @deprecated please use instance properties
     */
    @Deprecated
    public int getConfidence() {
        return this.confidence;
    }

    /**
     * Set the confidence value
     *
     * @param confidence the confidence to set
     *
     * @deprecated please use instance properties
     */
    @Deprecated
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

    public static class ResourceInstanceMergeCallback implements WegasCallback {

        @Override
        public Object remove(Object entity, IMergeable container, Object identifier) {
            if (entity instanceof Assignment) {
                Assignment assignment = (Assignment) entity;
                TaskInstance parent = (TaskInstance) VariableInstanceFacade.lookup().find(assignment.getTaskInstance().getId());
                if (parent != null) {
                    parent.removeAssignment(assignment);
                }
            } else if (entity instanceof Activity) {
                Activity activity = (Activity) entity;
                TaskInstance tdParent = (TaskInstance) VariableInstanceFacade.lookup().find(activity.getTaskInstance().getId());
                if (tdParent != null) {
                    tdParent.removeActivity(activity);
                }
                if (activity.getRequirement() != null) {
                    activity.getRequirement().removeActivity(activity);
                }
            }
            return null;
        }
    }

    /*
     * private class UpdaterImpl implements ListUtils.Updater {
     *
     * private ResourceInstance parent;
     *
     * public UpdaterImpl(ResourceInstance parent) {
     * this.parent = parent;
     * }
     *
     * @Override
     * public void addEntity(AbstractEntity entity) {
     * Occupation o = (Occupation) entity;
     * o.setResourceInstance(parent);
     * }
     *
     * @Override
     * public void removeEntity(AbstractEntity entity) {
     * }
     * }
     */
}
