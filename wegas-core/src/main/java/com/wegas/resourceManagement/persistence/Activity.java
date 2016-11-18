/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.rest.util.Views;
import javax.persistence.*;
//import javax.xml.bind.annotation.XmlTransient;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.resourceManagement.ejb.ResourceFacade;

/**
 *
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
@Entity

@Table(indexes = {
    @Index(columnList = "variableinstance_id")
})
public class Activity extends AbstractAssignement /*implements Broadcastable */ {

    private static final long serialVersionUID = 1L;
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
    private double time;

    /**
     * Start time
     */
    @Column(name = "stime")
    private double sTime;

    /**
     *
     */
    @Column(name = "wcompletion")
    private double completion;
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
    @ManyToOne(optional = false)
    @JoinColumn(name = "taskdescriptor_id", nullable = false)
    //@XmlTransient
    @JsonIgnore
    private TaskDescriptor taskDescriptor;
    /**
     *
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "variableinstance_id", nullable = false)
    @JsonBackReference
    @JsonIgnore
    private ResourceInstance resourceInstance;
    /**
     *
     */
    @ManyToOne(optional = true, cascade = CascadeType.ALL)
    @JoinColumn(name = "wrequirement_id", nullable = true)
    //@XmlTransient
    @JsonIgnore
    private WRequirement requirement;

    /**
     *
     */
    public Activity() {
        this.time = 0.0D;
        this.completion = 0.0D;
        this.description = "";
        this.requirement = null;
    }

    /**
     *
     * @param taskDescriptor public Activity(TaskDescriptor taskDescriptor) {
     *                       this.taskDescriptor = taskDescriptor; this.time =
     *                       0D; this.completion = 0.0D; this.description = "";
     *                       this.requirement = null; }
     */
    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof Activity) {
            Activity other = (Activity) a;
            this.setRequirement(other.getRequirement());
            this.setResourceInstance(other.getResourceInstance());
            this.setTime(other.getTime());
            this.setStartTime(other.getStartTime());
            this.setCompletion(other.getCompletion());
            this.setTaskDescriptor(other.getTaskDescriptor());
            this.setDescription(other.getDescription());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    /*@PostPersist
     @PostUpdate
     @PostRemove
     private void onUpdate() {
     this.getResourceInstance().onInstanceUpdate();
    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        return this.getResourceInstance().getEntities();
    }
     }*/
    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the MCQDescriptor
     */
    //@XmlTransient
    @JsonBackReference
    @JsonIgnore
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
        return sTime;
    }

    /**
     * Set startTime
     *
     * @param sTime
     */
    public void setStartTime(double sTime) {
        this.sTime = sTime;
    }

    /**
     *
     * @return id of the task descriptor this activity is linked to
     */
    public Long getTaskDescriptorId() {
        return this.getTaskDescriptor().getId();
    }

    /**
     * @return the taskDescriptor
     */
    //@XmlTransient
    @JsonIgnore
    public TaskDescriptor getTaskDescriptor() {
        return taskDescriptor;
    }

    /**
     * @param taskDescriptor the taskDescriptor to set
     */
    @JsonProperty
    public void setTaskDescriptor(TaskDescriptor taskDescriptor) {
        this.taskDescriptor = taskDescriptor;
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
     * @return the requirement
     */
    public WRequirement getRequirement() {
        return requirement;
    }

    /**
     * @param requirement the requirement to set
     */
    public void setRequirement(WRequirement requirement) {
        this.requirement = requirement;
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        TaskDescriptor theTask = this.getTaskDescriptor();
        ResourceInstance theResource = this.getResourceInstance();
        WRequirement theReq = this.getRequirement();

        if (theTask != null) {
            theTask = ((TaskDescriptor) beans.getVariableDescriptorFacade().find(theTask.getId()));
            if (theTask != null) {
                theTask.getAssignments().remove(this);
            }
        }
        if (theResource != null) {
            theResource = ((ResourceInstance) beans.getVariableInstanceFacade().find(theResource.getId()));
            if (theResource != null) {
                theResource.getAssignments().remove(this);
            }
        }
        if (theReq != null) {
            TaskInstance taskInstance = theReq.getTaskInstance();
            if (taskInstance != null) {
                taskInstance = ((TaskInstance) beans.getVariableInstanceFacade().find(taskInstance.getId()));
                if (taskInstance != null) {

                    theReq = beans.getResourceFacade().findRequirement(theReq.getId());

                    //theReq = taskInstance.getRequirementById(theReq.getId());
                    if (theReq != null) {
                        theReq.removeActivity(this);
                    }
                }
            }
        }
    }
}
