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
public class Assignment extends AbstractEntity {

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
    private double startTime;
    /**
     *
     */
    private double duration;
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
    public Assignment() {
    }

    /**
     *
     * @param taskInstance
     */
    public Assignment(TaskInstance taskInstance) {
        this.duration = 0;
        this.taskInstance = taskInstance;
    }

    /**
     *
     * @param startTime
     * @param taskInstance
     */
    public Assignment(double startTime, TaskInstance taskInstance) {
        this.startTime = startTime;
        this.duration = 0;
        this.taskInstance = taskInstance;
    }

    /**
     *
     * @param startTime
     * @param duration
     * @param taskDescriptor
     */
    public Assignment(double startTime, double duration, TaskInstance taskInstance) {
        this.startTime = startTime;
        this.startTime = duration;
        this.taskInstance = taskInstance;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Assignment other = (Assignment) a;
        this.setResourceInstance(other.getResourceInstance());
        this.setStartTime(other.getStartTime());
        this.setDuration(other.getDuration());
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
    public double getStartTime() {
        return startTime;
    }

    /**
     * @param startTime the startTime to set
     */
    public void setStartTime(double startTime) {
        this.startTime = startTime;
    }

    /**
     * @return the duration
     */
    public double getDuration() {
        return duration;
    }

    /**
     * @param duration the duration to set
     */
    public void setDuration(double duration) {
        this.duration = duration;
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
     * @param duration the duration to set
     */
    public void setDuration(Double duration) {
        this.duration = duration;
    }
}
