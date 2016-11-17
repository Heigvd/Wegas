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

/**
 *
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
@Table(indexes = {
    @Index(columnList = "variableinstance_id"),
    @Index(columnList = "taskdescriptor_id")
})
@NamedQueries({
    @NamedQuery(
            name = "Assignment.findByResourceInstanceIdAndTaskDescriptorId",
            query = "SELECT a FROM Assignment a where a.resourceInstance.id = :resourceInstanceId AND a.taskDescriptor.id = :taskDescriptorId"
    )
})
@Entity
public class Assignment extends AbstractAssignement /*implements Broadcastable */ {

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
        if (a instanceof Assignment) {
            Assignment other = (Assignment) a;
            // TODO TGSS: Avoid setting/updating relations within merge method !
            this.setResourceInstance(other.getResourceInstance());
            this.setTaskDescriptor(other.getTaskDescriptor());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + (a != null ? a.getClass().getSimpleName() : "NULL") + ") is not possible");
        }
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
     * @return id of the task descriptor this assignment is linked to
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

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        TaskDescriptor theTask = this.getTaskDescriptor();
        ResourceInstance theResource = this.getResourceInstance();

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
    }
}
