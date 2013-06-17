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
public class Assignment extends AbstractAssignement {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
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
        this.setTaskInstance(other.getTaskInstance());
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
}
