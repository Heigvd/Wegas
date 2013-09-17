/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.rest.util.Views;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
@Entity
public class Activity extends AbstractAssignement {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @Column(name = "wtime")
    private Double time;
    /**
     *
     */
    private Boolean editable;
    /**
     *
     */
    @Column(name = "wcompletion")
    private Double completion;
    /**
     *
     */
    @Lob
    @Basic(fetch = FetchType.LAZY)
    @JsonView(Views.ExtendedI.class)
    private String description;
    /**
     *
     */
    @ManyToOne(optional = false)
    @JoinColumn(name = "taskdescriptor_id", nullable = false)
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
    @ManyToOne(optional = true, cascade = CascadeType.ALL, targetEntity = WRequirement.class)
    @JoinColumn(name = "wrequirement_id", nullable = true)
    @XmlTransient
    private WRequirement requirement;

    /**
     *
     */
    public Activity() {
        this.time = 0.0D;
        this.completion = 0.0D;
        this.description = "";
        this.requirement = null;
    }

    /**
     *
     * @param taskDescriptor
     */
    public Activity(TaskDescriptor taskDescriptor) {
        this.taskDescriptor = taskDescriptor;
        this.time = 0D;
        this.completion = 0.0D;
        this.description = "";
        this.requirement = null;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Activity other = (Activity) a;
        this.setResourceInstance(other.getResourceInstance());
        this.setTime(other.getTime());
        this.setCompletion(other.getCompletion());
        this.setTaskDescriptor(other.getTaskDescriptor());
        this.setDescription(other.getDescription());
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
     * @return the time
     */
    public Double getTime() {
        return time;
    }

    /**
     * @param time the time to set
     */
    public void setTime(Double time) {
        this.time = time;
    }

    /**
     *
     * @return
     */
    public Boolean getEditable() {
        return editable;
    }

    /**
     *
     * @param editable
     */
    public void setEditable(Boolean editable) {
        this.editable = editable;
    }

    /**
     *
     * @return
     */
    public Long getTaskDescriptorId() {
        return this.getTaskDescriptor().getId();
    }

    /**
     * @return the taskDescriptor
     */
    @XmlTransient
    public TaskDescriptor getTaskDescriptor() {
        return taskDescriptor;
    }

    /**
     * @param taskDescriptor the taskDescriptor to set
     */
    public void setTaskDescriptor(TaskDescriptor taskDescriptor) {
        this.taskDescriptor = taskDescriptor;
    }

    /**
     * @return the completion
     */
    public Double getCompletion() {
        return completion;
    }

    /**
     * @param completion the completion to set
     */
    public void setCompletion(Double completion) {
        this.completion = completion;
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

    /**
     * @return the requirement
     */
    public WRequirement getRequirement() {
        return requirement;
    }

    /**
     * @param requirement the requirement to set
     */
    public void setRequirement(WRequirement requirement) {
        this.requirement = requirement;
    }
}
