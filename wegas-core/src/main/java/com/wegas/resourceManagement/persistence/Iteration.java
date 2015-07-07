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
import com.wegas.core.persistence.ListUtils;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * PMG Related !
 *
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity

@Table(indexes = {
    @Index(columnList = "burndowninstance_variableinstance_id")
})
public class Iteration extends AbstractEntity {

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     * Iteration Name
     */
    private String name;

    /**
     * Period number the iteration shall start on
     */
    private Long beginAt;

    /**
     * Total workload as computed at iteration beginning
     */
    private Double totalWorkload;

    /**
     * planned workload from beginAt period
     */
    @ElementCollection
    private Map<Long, Double> plannedWorkloads;

    /**
     * maps a period number with workload for past period and current one:
     * indicates the total remaining workload for the corresponding period.
     */
    @ElementCollection
    private Map<Long, Double> workloads;

    /**
     * maps a period number with workload for current period and future ones:
     * Indicate the planned workload consumption
     */
    @ElementCollection
    private Map<Long, Double> replannedWorkloads;

    /**
     * Tasks composing the iteration
     */
    @OneToMany
    @JsonIgnore
    private List<TaskDescriptor> tasks;

    /**
     * parent BurndownInstance
     */
    @ManyToOne(optional = false)
    @JsonBackReference
    @JsonIgnore
    private BurndownInstance burndownInstance;

    /**
     *
     */
    public Iteration() {
    }

    @Override
    public Long getId() {
        return this.id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public BurndownInstance getBurndownInstance() {
        return burndownInstance;
    }

    /**
     * set the parent
     *
     * @param burndownInstance the new parent instance
     */
    public void setBurndownInstance(BurndownInstance burndownInstance) {
        this.burndownInstance = burndownInstance;
    }

    /**
     * @return the period number iteration is planned to start on
     */
    public Long getBeginAt() {
        return beginAt;
    }

    /**
     * set period number the iteration is planned to start on
     *
     * @param beginAt period number iteration is planned to start on
     */
    public void setBeginAt(Long beginAt) {
        this.beginAt = beginAt;
    }

    /**
     * Get the total iteration workloads as it was on the beginning of the
     * iteration
     *
     * @return
     */
    public Double getTotalWorkload() {
        return totalWorkload;
    }

    /**
     * the the initial total workload
     *
     * @param totalWorkload initial workload
     */
    public void setTotalWorkload(Double totalWorkload) {
        this.totalWorkload = totalWorkload;
    }

    /**
     * get the workload for each iteration period period number are relative to
     * beginAt attribute
     *
     * @return
     */
    public Map<Long, Double> getPlannedWorkloads() {
        return plannedWorkloads;
    }

    /**
     * set the workload planning
     *
     * @param plannedWorkloads the planning
     */
    public void setPlannedWorkloads(Map<Long, Double> plannedWorkloads) {
        this.plannedWorkloads = plannedWorkloads;
    }

    /**
     * get effective workload (for past and current periods)
     *
     * @return
     */
    public Map<Long, Double> getWorkloads() {
        return workloads;
    }

    /**
     * set effective workloads
     *
     * @param workloads
     */
    public void setWorkloads(Map<Long, Double> workloads) {
        this.workloads = workloads;
    }

    /**
     * get replanned workloads consumption
     *
     * @return the planned workloads consumption
     */
    public Map<Long, Double> getReplannedWorkloads() {
        return replannedWorkloads;
    }

    /**
     * set the replanned workloads consumption
     *
     * @param replannedWorkloads
     */
    public void setReplannedWorkloads(Map<Long, Double> replannedWorkloads) {
        this.replannedWorkloads = replannedWorkloads;
    }

    /**
     * retrieve the list of tasks composing the iteration
     *
     * @return
     */
    public List<TaskDescriptor> getTasks() {
        return tasks;
    }

    /**
     * set the list of task composing the iteration
     *
     * @param tasks tasks composing the iteration
     */
    public void setTasks(List<TaskDescriptor> tasks) {
        this.tasks = tasks;
    }

    public List<Long> getTaskDescriptorsId() {
        List<Long> ids = new ArrayList<>();
        for (TaskDescriptor td : getTasks()) {
            ids.add(td.getId());
        }
        return ids;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Iteration other = (Iteration) a;
        this.setBeginAt(other.getBeginAt());
        this.setName(other.getName());

        //ListUtils.updateList(tasks, other.getTasks());
        //this.setPlannedWorkload(other.getPlannedWorkload());
        //this.setReplannedWorkloads(replannedWorkloads);
        //this.setTotalWorkload(other.getTotalWorkload());
        //this.setWorkloads();
    }

    /**
     * tie lifecycle events with burdownInstnace ones
     */
    @PostPersist
    @PostUpdate
    @PostRemove
    private void onUpdate() {
        this.getBurndownInstance().onInstanceUpdate();
    }
}
