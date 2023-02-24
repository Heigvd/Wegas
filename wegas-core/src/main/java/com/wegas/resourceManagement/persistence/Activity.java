/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.view.NumberView;
import com.wegas.editor.view.StringView;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

/**
 *
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
@Entity
@Table(indexes = {
    @Index(columnList = "resourceinstance_id"),
    @Index(columnList = "taskinstance_id"),
    @Index(columnList = "requirement_id")
})
public class Activity extends AbstractAssignement {

    private static final long serialVersionUID = 1L;

    @Transient
    @JsonIgnore
    @WegasEntityProperty(
            nullable = false, optional = false,
            view = @View(readOnly = true, value = StringView.class, label = "Requirement name"))
    private String requirementName;

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     * worked time ? strange spelling...
     */
    @Column(name = "wtime")
    @WegasEntityProperty(
            nullable = false, optional = false,
            view = @View(readOnly = true, value = NumberView.class, label = "time"))
    private double time;

    /**
     * Start time
     */
    @Column(name = "stime")
    @WegasEntityProperty(
            nullable = false, optional = false,
            view = @View(readOnly = true, value = NumberView.class, label = "Start time"))
    private double startTime;

    /**
     *
     */
    @Column(name = "wcompletion")
    @WegasEntityProperty(
            nullable = false, optional = false,
            view = @View(readOnly = true, value = NumberView.class, label = "Completion"))
    private double completion;
    /**
     *
     */
    @ManyToOne(optional = false)
    private TaskInstance taskInstance;

    /**
     *
     */
    @ManyToOne(optional = false)
    @JoinColumn(nullable = false)
    @JsonBackReference
    @JsonIgnore
    private ResourceInstance resourceInstance;

    /**
     *
     */
    @ManyToOne(optional = true)
    @JsonIgnore
    private WRequirement requirement;

    /**
     *
     */
    public Activity() {
        super();
        this.time = 0.0D;
        this.completion = 0.0D;
        this.requirement = null;
    }

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the ResourceInstance
     */
    @JsonBackReference
    @JsonIgnore
    @Override
    public ResourceInstance getResourceInstance() {
        return resourceInstance;
    }

    /**
     * @param resourceInstance
     */
    @JsonBackReference
    public void setResourceInstance(ResourceInstance resourceInstance) {
        this.resourceInstance = resourceInstance;
    }

    /**
     * @return the time
     */
    public double getTime() {
        return time;
    }

    /**
     * @param time the time to set
     */
    public void setTime(double time) {
        this.time = time;
    }

    /**
     *
     * @return the start time (Period.Step)
     */
    public double getStartTime() {
        return startTime;
    }

    /**
     * Set startTime
     *
     * @param sTime
     */
    public void setStartTime(double sTime) {
        this.startTime = sTime;
    }

    /**
     * @return the taskInstance
     */
    @JsonIgnore
    @Override
    public TaskInstance getTaskInstance() {
        return taskInstance;
    }

    /**
     * @param taskInstance
     */
    @JsonProperty
    public void setTaskInstance(TaskInstance taskInstance) {
        this.taskInstance = taskInstance;
    }

    /**
     * @return the completion
     */
    public double getCompletion() {
        return completion;
    }

    /**
     * @param completion the completion to set
     */
    public void setCompletion(double completion) {
        this.completion = completion;
    }

    /**
     * @return the requirement
     */
    public WRequirement getRequirement() {
        return requirement;
    }

    /**
     * Unique req name
     *
     * @return unique id for the requirement
     */
    public String getRequirementName() {
        if (requirement != null) {
            return requirement.getName();
        } else {
            return requirementName;
        }
    }

    /**
     * Set requirement name
     *
     * @param name
     */
    public void setRequirementName(String name) {
        this.requirementName = name;
    }

    /**
     * @param requirement the requirement to set
     */
    public void setRequirement(WRequirement requirement) {
        this.requirement = requirement;
        if (requirement != null) {
            this.requirementName = null;
        }
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        TaskInstance theTask = this.getTaskInstance();
        ResourceInstance theResource = this.getResourceInstance();
        WRequirement theReq = this.getRequirement();

        if (theTask != null) {
            VariableInstance find = beans.getVariableInstanceFacade().find(theTask.getId());
            if (find instanceof TaskInstance) {
                ((TaskInstance) find).getActivities().remove(this);
            }
        }
        if (theResource != null) {
            VariableInstance find = beans.getVariableInstanceFacade().find(theResource.getId());
            if (find instanceof ResourceInstance){
                ((ResourceInstance) find).getActivities().remove(this);
            }
        }

        if (theReq != null) {
            TaskInstance ti = theReq.getTaskInstance();
            if (ti != null) {
                VariableInstance find = beans.getVariableInstanceFacade().find(ti.getId());
                if (find instanceof TaskInstance) {
                    theReq = beans.getResourceFacade().findRequirement(theReq.getId());

                    //theReq = taskInstance.getRequirementById(theReq.getId());
                    if (theReq != null) {
                        theReq.removeActivity(this);
                    }
                }
            }
        }

        super.updateCacheOnDelete(beans);
    }
}
