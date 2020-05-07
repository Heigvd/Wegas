/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.resourceManagement.ejb.IterationFacade;
import java.io.Serializable;
import java.util.Collection;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Transient;

/**
 * PMG Related !
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
@Table(indexes = {
    @Index(columnList = "iterationperiod_id"),
    @Index(columnList = "taskinstance_id")
})
public class IterationEvent extends AbstractEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    public enum EventType {
        ADD_TASK,
        REMOVE_TASK,
        START_TASK,
        COMPLETE_TASK,
        WORKLOAD_ADJUSTMENT,
        SPENT_ADJUSTMENT,
        BUDGETED_ADJUSTMENT,
    }

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @ManyToOne
    @JsonBackReference
    private IterationPeriod iterationPeriod;

    /**
     * Period subdivision step
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "step"))
    private Integer step;

    /**
     * some payload
     */
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "data"))
    private String data;

    @Transient
    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(label = "Task name")
    )
    private String taskName;

    @ManyToOne
    @JsonIgnore
    private TaskInstance taskInstance;

    @Enumerated(value = EnumType.STRING)
    @WegasEntityProperty(
        optional = false, nullable = false, view = @View(label = "Event Type"))
    private EventType eventType;

    @Override
    public Long getId() {
        return id;
    }

    public IterationPeriod getIterationPeriod() {
        return iterationPeriod;
    }

    public void setIterationPeriod(IterationPeriod iterationPeriod) {
        this.iterationPeriod = iterationPeriod;
    }

    @JsonIgnore
    public String getDeserialisedTaskName() {
        return taskName;
    }

    public String getTaskName() {
        if (taskName == null && this.getTaskInstance() != null) {
                return this.getTaskInstance().findDescriptor().getName();
        }
        return taskName;
    }

    public void setTaskName(String taskName) {
        this.taskName = taskName;
    }

    public TaskInstance getTaskInstance() {
        return taskInstance;
    }

    public void setTaskInstance(TaskInstance taskInstance) {
        this.taskInstance = taskInstance;
        if (this.taskInstance != null){
            this.taskInstance.addIterationEvent(this);
        }
    }

    public EventType getEventType() {
        return eventType;
    }

    public void setEventType(EventType eventType) {
        this.eventType = eventType;
    }

    public Integer getStep() {
        return step;
    }

    public void setStep(Integer step) {
        this.step = step;
    }

    public String getData() {
        return data;
    }

    public void setData(String data) {
        this.data = data;
    }

    @Override
    public WithPermission getMergeableParent() {
        return getIterationPeriod();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getMergeableParent().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getMergeableParent().getRequieredReadPermission();
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        VariableInstanceFacade vif = beans.getVariableInstanceFacade();
        IterationFacade iterF = beans.getIterationFacade();

        // remove from task
        TaskInstance ti = this.getTaskInstance();
        if (ti != null) {
            ti = (TaskInstance) vif.find(ti.getId());
            if (ti != null) {
                ti.removeEvent(this);
            }
        }

        // remove from period
        IterationPeriod ip = this.getIterationPeriod();
        if (ip != null) {
            ip = (IterationPeriod) iterF.findIterationPeriod(ip.getId());
            if (ip != null) {
                ip.removeEvent(this);
            }
        }
        // remove from iteration period
    }
}
