/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.persistence;

import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonIgnore;

/**
 *
 */
@Entity
public class Activity extends AbstractAssignement {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    private Double startTime;
    /**
     *
     */
    private Double duration;
    /**
     *
     */
    @OneToOne(optional = true, cascade = CascadeType.PERSIST)
    @JoinColumn(name = "wrequirement_id", nullable = true)
    @XmlTransient
    private WRequirement wrequirement;
    /**
     *
     */
    @Column(name = "wcompletion")
    private Integer completion;
    /**
     *
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "taskinstance_id", nullable = false)
    @XmlTransient
    private TaskInstance taskInstance;
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
    public Activity() {
    }

    /**
     *
     * @param taskInstance
     */
    public Activity(TaskInstance taskInstance) {
        this.taskInstance = taskInstance;
        this.startTime = 0D;
        this.duration = 0D;
        this.completion = 0;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Activity other = (Activity) a;
        this.setResourceInstance(other.getResourceInstance());
        this.setStartTime(other.getStartTime());
        this.setDuration(other.getDuration());
        this.setCompletion(other.getCompletion());
        //this.setTaskInstance(other.getTaskInstance());
    }

    @PostPersist
    @PostUpdate
    @PostRemove
    private void onUpdate() {
        this.getResourceInstance().onInstanceUpdate();
    }

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the MCQDescriptor
     */
    @XmlTransient
    @JsonBackReference
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
     * @return the startTime
     */
    public Double getStartTime() {
        return startTime;
    }

    /**
     * @param startTime the startTime to set
     */
    public void setStartTime(double startTime) {
        this.startTime = startTime;
    }

    /**
     *
     * @return
     */
    public Long getTaskDescriptorId() {
        return this.getTaskInstance().getDescriptorId();
    }

    /**
     * @return the taskInstance
     */
    @XmlTransient
    public TaskInstance getTaskInstance() {
        return taskInstance;
    }

    /**
     * @param taskInstance the taskInstance to set
     */
    public void setTaskInstance(TaskInstance taskInstance) {
        this.taskInstance = taskInstance;
    }

    /**
     * @return the duration
     */
    public Double getDuration() {
        return duration;
    }

    /**
     * @param duration the duration to set
     */
    public void setDuration(Double duration) {
        this.duration = duration;
    }

    /**
     * @return the completion
     */
    public Integer getCompletion() {
        return completion;
    }

    /**
     * @param completion the completion to set
     */
    public void setCompletion(Integer completion) {
        this.completion = completion;
    }

    /**
     * @return the wrequirement
     */
    public WRequirement getWrequirement() {
        return wrequirement;
    }

    /**
     * @param wrequirement the wrequirement to set
     */
    public void setWrequirement(WRequirement wrequirement) {
        this.wrequirement = wrequirement;
    }
}
