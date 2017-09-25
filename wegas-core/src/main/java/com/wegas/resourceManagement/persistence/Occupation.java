/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
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
import java.io.Serializable;

/**
 *
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
@Entity

@Table(indexes = {
    @Index(columnList = "variableinstance_id")
})
public class Occupation extends AbstractEntity {

    private static final long serialVersionUID = 5183770682755470296L;
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
    @Basic(fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    @JsonView(Views.ExtendedI.class)
    private String description = "";

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
            //this.setResourceInstance(other.getResourceInstance());
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
