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

/**
 *
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
@Entity
public class Assignment extends AbstractAssignement {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "taskdescriptor_id", nullable = false)
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
    public Assignment() {
    }

    /**
     *
     * @param taskDescriptor
     */
    public Assignment(TaskDescriptor taskDescriptor) {
        this.taskDescriptor = taskDescriptor;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Assignment other = (Assignment) a;
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
     * @return the MCQDescriptor
     */
    //@XmlTransient
    @JsonIgnore
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
    //@XmlTransient
    @JsonIgnore
    public TaskDescriptor getTaskDescriptor() {
        return taskDescriptor;
    }

    /**
     * @param taskDescriptor
     */
    @JsonProperty
    public void setTaskDescriptor(TaskDescriptor taskDescriptor) {
        this.taskDescriptor = taskDescriptor;
    }
}
