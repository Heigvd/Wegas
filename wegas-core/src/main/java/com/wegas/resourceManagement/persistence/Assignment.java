/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.rest.util.Views;
import javax.persistence.*;
//import javax.xml.bind.annotation.XmlTransient;

/**
 *
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
@Table(indexes = {
    @Index(columnList = "variableinstance_id")
    ,
    @Index(columnList = "taskdescriptor_id")
})
@NamedQueries({
    @NamedQuery(
            name = "Assignment.findByResourceInstanceIdAndTaskInstanceId",
            query = "SELECT a FROM Assignment a where a.resourceInstance.id = :resourceInstanceId AND a.taskInstance.id = :taskInstanceId"
    )
})
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
    @JoinColumn(name = "taskinstance_id")
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
        super();
    }

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the ResourceInstance
     */
    //@XmlTransient
    @JsonIgnore
    @JsonBackReference
    @Override
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
     * @return the taskInstance
     */
    //@XmlTransient
    @JsonIgnore
    @Override
    public TaskInstance getTaskInstance() {
        return taskInstance;
    }

    /**
     * @param taskInstance
     */
    @JsonProperty
    public void setTaskInstance(TaskInstance taskInstance) {
        this.taskInstance = taskInstance;
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        TaskInstance theTask = this.getTaskInstance();
        ResourceInstance theResource = this.getResourceInstance();

        if (theTask != null) {
            theTask = ((TaskInstance) beans.getVariableInstanceFacade().find(theTask.getId()));
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

    @Override
    public String getRequieredUpdatePermission() {
        return this.getResourceInstance().getRequieredUpdatePermission();
    }

    @Override
    public String getRequieredReadPermission() {
        return this.getResourceInstance().getRequieredReadPermission();
    }
}
