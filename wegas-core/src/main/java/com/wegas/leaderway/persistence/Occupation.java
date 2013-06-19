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
public class Occupation extends AbstractAssignement {

    private static final long serialVersionUID = 1L;
    /**
     * 
     */
    Double startTime;
    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    @ManyToOne(optional = true)
    @JoinColumn(name = "taskdescriptor_id", nullable = true)
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
    public Occupation() {
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Occupation other = (Occupation) a;
        this.setResourceInstance(other.getResourceInstance());
        this.setTaskDescriptor(other.getTaskDescriptor());
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
     *
     * @return
     */
    public Long getTaskDescriptorId() {
        return this.getTaskDescriptor().getId();
    }

    /**
     * @return the taskInstance
     */
    @XmlTransient
    public TaskDescriptor getTaskDescriptor() {
        return taskDescriptor;
    }

    /**
     * @param taskInstance the taskInstance to set
     */
    public void setTaskDescriptor(TaskDescriptor taskDescriptor) {
        this.taskDescriptor = taskDescriptor;
    }
}
