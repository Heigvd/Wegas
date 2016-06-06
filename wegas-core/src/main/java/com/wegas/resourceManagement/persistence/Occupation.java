/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.rest.util.Views;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasIncompatibleType;

/**
 *
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
@Entity

@Table(indexes = {
    @Index(columnList = "variableinstance_id")
})
public class Occupation extends AbstractAssignement /* implements Broadcastable */ {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     *
     */
    @Column(name = "wtime")
    private double time = 0.0D;
    /**
     *
     */
    private Boolean editable = true;
    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
    private String description = "";
    /**
     *
     *
     * @ManyToOne(optional = true)
     * @JoinColumn(name = "taskdescriptor_id", nullable = true)
     * @JsonIgnore private TaskDescriptor taskDescriptor;
     */

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
     * @param time
     */
    public Occupation(double time) {
        this.time = time;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof Occupation) {
            Occupation other = (Occupation) a;
            this.setDescription(other.getDescription());
            this.setTime(other.getTime());
            this.setEditable(other.getEditable());
            this.setResourceInstance(other.getResourceInstance());
            //this.setTaskDescriptor(other.getTaskDescriptor());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    /*
     @PostPersist
     @PostUpdate
     @PostRemove
     private void onUpdate() {
     this.getResourceInstance().onInstanceUpdate();
     }
    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        return this.getResourceInstance().getEntities();
    }
     */

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the time
     */
    public double getTime() {
        return time;
    }

    /**
     * @param time the time to set
     */
    public void setTime(double time) {
        this.time = time;
    }

    /**
     * @return the ResourceInstance
     */
    @JsonBackReference
    @JsonIgnore
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
     *
     * @JsonIgnore public Long getTaskDescriptorId() { if (this.taskDescriptor
     * != null) { return this.taskDescriptor.getId(); } else { return null; } }
     */
    /**
     * @return the taskInstance
     *
     * @JsonIgnore public TaskDescriptor getTaskDescriptor() { return
     * taskDescriptor; }
     */
    /**
     * @param taskDescriptor
     *
     * public void setTaskDescriptor(TaskDescriptor taskDescriptor) {
     * this.taskDescriptor = taskDescriptor; }
     */
    /**
     * @return the editable
     */
    public boolean getEditable() {
        return editable;
    }

    /**
     * @param editable the editable to set
     */
    public void setEditable(boolean editable) {
        this.editable = editable;
    }

    /**
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }
}
