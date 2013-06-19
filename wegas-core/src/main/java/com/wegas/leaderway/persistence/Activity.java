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
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
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
    @Column(name = "wcompletion")
    private Integer completion;
    /**
     *
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "taskdescriptor_id", nullable = false)
    @XmlTransient
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
    public Activity() {
    }

    /**
     *
     * @param taskDescriptor
     */
    public Activity(TaskDescriptor taskDescriptor) {
        this.taskDescriptor = taskDescriptor;
        this.startTime = 0D;
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
        this.setCompletion(other.getCompletion());
        //this.setTaskDescriptor(other.getTaskDescriptor());
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
     *
     * @return
     */
    public Long getTaskDescriptorId() {
        return this.getTaskDescriptor().getId();
    }

    /**
     * @return the taskDescriptor
     */
    @XmlTransient
    public TaskDescriptor getTaskDescriptor() {
        return taskDescriptor;
    }

    /**
     * @param taskDescriptor the taskDescriptor to set
     */
    public void setTaskDescriptor(TaskDescriptor taskDescriptor) {
        this.taskDescriptor = taskDescriptor;
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
}
