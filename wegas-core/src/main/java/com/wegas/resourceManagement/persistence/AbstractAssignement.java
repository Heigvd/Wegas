/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.AbstractEntity;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.wegas.core.exception.client.WegasIncompatibleType;
import javax.persistence.Transient;

/**
 *
 * @author Benjamin
 */
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "Activity", value = Activity.class)
    ,
    @JsonSubTypes.Type(name = "Assignment", value = Assignment.class)
})
public abstract class AbstractAssignement extends AbstractEntity {

    private static final long serialVersionUID = 324778908917012703L;

    public AbstractAssignement() {
        super();
    }

    @JsonIgnore
    @Transient
    private String deserialisedTaskName;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof AbstractAssignement) {
            AbstractAssignement other = (AbstractAssignement) a;
            this.setTaskDescriptorName(other.getTaskDescriptorName());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + (a != null ? a.getClass().getSimpleName() : "NULL") + ") is not possible");
        }
    }

    /**
     *
     * @return name of the task descriptor this activity is linked to
     */
    public String getTaskDescriptorName() {
        if (this.getTaskInstance() != null) {
            return this.getTaskInstance().findDescriptor().getName();
        } else {
            return this.deserialisedTaskName;
        }
    }

    public abstract TaskInstance getTaskInstance();

    public abstract ResourceInstance getResourceInstance();

    /**
     *
     * @param taskName taskinstance name
     */
    public void setTaskDescriptorName(String taskName) {
        this.deserialisedTaskName = taskName;
    }
}
