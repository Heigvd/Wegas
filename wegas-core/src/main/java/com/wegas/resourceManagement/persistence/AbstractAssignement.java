/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import javax.persistence.Transient;

/**
 *
 * @author Benjamin
 */
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "Activity", value = Activity.class),
    @JsonSubTypes.Type(name = "Assignment", value = Assignment.class)
})
public abstract class AbstractAssignement extends AbstractEntity {

    private static final long serialVersionUID = 324778908917012703L;

    public AbstractAssignement() {
        super();
    }

    @JsonIgnore
    @Transient
    @WegasEntityProperty
    private String taskDescriptorName;


    /**
     *
     * @return name of the task descriptor this activity is linked to
     */
    public String getTaskDescriptorName() {
        if (this.getTaskInstance() != null) {
            return this.getTaskInstance().findDescriptor().getName();
        } else {
            return this.taskDescriptorName;
        }
    }

    public abstract TaskInstance getTaskInstance();

    public abstract ResourceInstance getResourceInstance();

    /**
     *
     * @param taskName taskinstance name
     */
    public void setTaskDescriptorName(String taskName) {
        this.taskDescriptorName = taskName;
    }

    @Override
    public boolean isProtected() {
        return this.getResourceInstance().isProtected();
    }

    @Override
    public Visibility getInheritedVisibility() {
        return getResourceInstance().getInheritedVisibility();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getResourceInstance().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getResourceInstance().getRequieredReadPermission();
    }
}
