/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.leaderway.persistence;

import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
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
    private Long startTime;
    /**
     *
     */
    @ManyToOne
    @JoinColumn(name = "taskDescriptor_id")
    private TaskDescriptor taskDescriptor;
    /**
     *
     */
    @Column(name = "taskDescriptor_id", nullable = false, insertable = false, updatable = false)
    private Long taskDescriptorId;
    /**
     *
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "variableinstance_id", nullable = false)
    @JsonBackReference
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
    public Assignment(Long startTime, TaskDescriptor taskDescriptor) {
        this.startTime = startTime;
        this.taskDescriptor = taskDescriptor;
        this.taskDescriptorId = taskDescriptor.getId();
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Assignment other = (Assignment) a;
        this.setTaskDescriptor(other.getTaskDescriptor());
        this.setResourceInstance(other.getResourceInstance());
        this.setStartTime(other.getStartTime());
        this.taskDescriptorId = this.getTaskDescriptor().getId();
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
    public Long getStartTime() {
        return startTime;
    }

    /**
     * @param startTime the startTime to set
     */
    public void setStartTime(Long startTime) {
        this.startTime = startTime;
    }

    /**
     * @return the choiceDescriptor
     */
    @XmlTransient
    public TaskDescriptor getTaskDescriptor() {
        return taskDescriptor;
    }

    /**
     * @param taskDescriptor
     */
    public void setTaskDescriptor(TaskDescriptor taskDescriptor) {
        this.taskDescriptor = taskDescriptor;
    }

    /**
     *
     * @return
     */
    public Long getTaskDescriptorId() {
        return this.taskDescriptorId;
    }

    /**
     *
     * @param newTaskDescriptorId
     * @return
     */
    public Long setTaskDescriptorId(long newTaskDescriptorId) {
        return this.taskDescriptorId = newTaskDescriptorId;
    }
}
