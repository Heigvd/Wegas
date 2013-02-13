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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @todo refactor so assignements points to task instances
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class Assignment extends AbstractEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(Assignment.class);
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
    /*
     *
     */
    @Column(name = "wcompletion")
    private Long completion = Long.valueOf(0);
    /**
     *
     */
    @ManyToOne
    @JoinColumn(name = "taskinstance_id")
    @JsonBackReference
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
     * @param startTime
     * @param taskDescriptor
     */
    public Assignment(Double startTime, TaskInstance taskInstance) {
        this.startTime = startTime;
        this.taskInstance = taskInstance;
        // this.taskDescriptorId = taskDescriptor.getId();
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Assignment other = (Assignment) a;
        this.setTaskInstance(other.getTaskInstance());
        this.setResourceInstance(other.getResourceInstance());
        this.setStartTime(other.getStartTime());
        //this.taskDescriptorId = this.getTaskDescriptor().getId();
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
    public void setStartTime(Double startTime) {
        this.startTime = startTime;
    }

    /**
     * @return the choiceDescriptor
     */
    @XmlTransient
    public TaskInstance getTaskInstance() {
        return taskInstance;
    }

    /**
     * @param taskDescriptor
     */
    public void setTaskInstance(TaskInstance taskInstance) {
        this.taskInstance = taskInstance;
    }

    /**
     *
     * @return
     */
    public Long getTaskDescriptorId() {
        return this.taskInstance.getDescriptorId();
    }

    /**
     * @return the completion
     */
    public Long getCompletion() {
        return completion;
    }

    /**
     * @param completion the completion to set
     */
    public void setCompletion(Long completion) {
        this.completion = completion;
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
}
