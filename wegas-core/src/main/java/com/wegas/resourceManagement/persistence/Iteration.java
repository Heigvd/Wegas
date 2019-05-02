/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;
import javax.persistence.*;

/**
 * PMG Related !
 *
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
@Table(indexes = {
    @Index(columnList = "burndowninstance_id")
})
public class Iteration extends AbstractEntity implements DatedEntity {

    private static final long serialVersionUID = 1L;

    public static enum IterationStatus {
        NOT_STARTED,
        STARTED,
        COMPLETED
    };

    //@JsonIgnore
    @Transient
    @WegasEntityProperty
    private Set<String> taskNames;

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date createdTime = new Date();

    /**
     * Iteration Name
     */
    @WegasEntityProperty
    private String name;

    @Enumerated(value = EnumType.STRING)
    @WegasEntityProperty
    private IterationStatus status = IterationStatus.NOT_STARTED;

    /**
     * Period number the iteration shall start on
     */
    @WegasEntityProperty
    private Long beginAt;

    /**
     * Total workload as computed at iteration beginning
     */
    @WegasEntityProperty
    private Double totalWorkload;

    @WegasEntityProperty
    private Double spi;

    @WegasEntityProperty
    private Double wpi;

    private Double cpi;

    private Double wages;

    /**
     * planned workload from beginAt period
     */
    @ElementCollection
    @JsonIgnore
    @WegasEntityProperty
    private List<IterationPlanning> plannedWorkloads = new ArrayList<>();

    /**
     * maps a period number with workload for current period and future ones:
     * Indicate the planned workload consumption
     */
    @ElementCollection
    @JsonIgnore
    @WegasEntityProperty
    private List<IterationPlanning> replannedWorkloads = new ArrayList<>();

    /**
     * maps a period number with workload for past period and current one:
     * indicates the total remaining workload for the corresponding period.
     */
    @OneToMany(mappedBy = "iteration", cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty
    private List<Workload> workloads = new ArrayList<>();

    /**
     * Tasks composing the iteration
     */
    @JsonIgnore
    @ManyToMany
    @JoinTable(name = "iteration_taskinstance",
            joinColumns = {
                @JoinColumn(name = "iteration_id", referencedColumnName = "id")
            },
            inverseJoinColumns = {
                @JoinColumn(name = "taskinstance_id", referencedColumnName = "id")
            }
    )
    private List<TaskInstance> tasks = new ArrayList<>();

    /**
     * parent BurndownInstance
     */
    @ManyToOne(optional = false)
    @JsonBackReference
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

    /**
     * @return the createdTime
     */
    @Override
    public Date getCreatedTime() {
        return createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    /**
     * @param createdTime the createdTime to set
     */
    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime != null ? new Date(createdTime.getTime()) : null;
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

    public IterationStatus getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = IterationStatus.valueOf(status);
    }

    public void setStatus(IterationStatus status) {
        this.status = status;
    }

    public Double getWages() {
        return wages;
    }

    public void setWages(Double wages) {
        this.wages = wages;
    }

    /**
     * Get the Cost Performance Index
     *
     * @return the CPI
     */
    public Double getCpi() {
        return this.cpi;
    }

    public void setCpi(Double cpi) {
        this.cpi = cpi;
    }

    /**
     * Get the Workload Performance Index
     *
     * @return the WPI
     */
    public Double getWpi() {
        return this.wpi;
    }

    public void setWpi(Double wpi) {
        this.wpi = wpi;
    }

    /**
     * Get the schedule Performance Index
     *
     * @return the SPI
     */
    public Double getSpi() {
        return spi;
    }

    /**
     * Set the schedule Performance Index
     *
     * @param spi
     */
    public void setSpi(Double spi) {
        this.spi = spi;
    }

    /**
     * Get the total iteration workloads as it was on the beginning of the
     * iteration
     *
     * @return iteration total workload
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

    @JsonIgnore
    private Long getLastPlannedPeriod() {
        Long max = 0l;
        Set<Long> periods = getPlannedWorkloads().keySet();
        for (Long p : periods) {
            if (p > max) {
                max = p;
            }
        }
        return max + beginAt;
    }

    @JsonIgnore
    public Double getPlannedValue(Double upTo) {
        double upToPeriod = Math.floor(upTo);

        if (Math.abs(upTo - upToPeriod) > 0.01) {
            Double prevPv = this.getPlannedValue(upToPeriod);
            Double nextPv = this.getPlannedValue(Math.ceil(upTo));
            Double delta = upTo - upToPeriod;
            return prevPv + delta * (nextPv - prevPv);
        } else {
            Double pv = 0.0;
            Map<Long, Double> pwl = getPlannedWorkloads();
            for (long i = 0; i < upToPeriod - this.beginAt; i++) {
                Double get = pwl.get(i);
                if (get != null) {
                    pv += get;
                }
            }

            if (pv >= this.getTotalWorkload()) {
                pv = this.getTotalWorkload();
                Long lastPlannedPeriod = getLastPlannedPeriod();
                if (upToPeriod > lastPlannedPeriod + 1) {
                    pv += (upToPeriod - lastPlannedPeriod - 1) * pv / (lastPlannedPeriod - beginAt + 1);
                }
            }
            return pv;
        }
    }

    @JsonIgnore
    public Double getActualWorkload(int upToPeriod) {
        Double aw = 0.0;

        for (Workload wl : this.workloads) {
            if (wl.getPeriodNumber() <= upToPeriod) {
                aw += wl.getSpentWorkload();
            }
        }
        return aw;
    }

    /**
     * get the workload for each iteration period period number are relative to
     * beginAt attribute
     *
     * @return planned workload, mapped by relative period number
     */
    @JsonIgnore
    private Map<Long, Double> getModifiablePlannedWorkloads() {
        return ListUtils.mapEntries(this.plannedWorkloads, new IterationPlanning.Extractor());
    }

    @JsonProperty
    public Map<Long, Double> getPlannedWorkloads() {
        return Collections.unmodifiableMap(this.getModifiablePlannedWorkloads());
    }

    /**
     * set the workload planning
     *
     * @param plannedWorkloads the planning
     */
    @JsonProperty
    public void setPlannedWorkloads(Map<Long, Double> plannedWorkloads) {
        this.plannedWorkloads.clear();
        if (plannedWorkloads != null) {
            for (Entry<Long, Double> entry : plannedWorkloads.entrySet()) {
                this.plannedWorkloads.add(new IterationPlanning(entry.getKey(), entry.getValue()));
            }
        }
    }

    /**
     * get effective workload (for past and current periods)
     *
     * @return get effective workloads (ie. work done by resources)
     */
    public List<Workload> getWorkloads() {
        return workloads;
    }

    public Workload getWorkload(Long periodNumber) {
        for (Workload wl : this.workloads) {
            if (wl.getPeriodNumber().equals(periodNumber)) {
                return wl;
            }
        }
        return null;
    }

    /**
     * set effective workloads
     *
     * @param workloads
     */
    public void setWorkloads(List<Workload> workloads) {
        this.workloads = workloads;
        if (this.workloads != null) {
            for (Workload wl : workloads) {
                wl.setIteration(this);
            }
        }
    }

    public void addWorkload(Long periodNumber, Double workload, Double spent) {
        this.addWorkload(periodNumber, workload, spent, 9);
    }

    public void updateWorkload(Long periodNumber, Double spent, Integer lastWorkedStep) {
        Workload workload = this.getWorkload(periodNumber);
        if (workload != null) {
            workload.setSpentWorkload(spent);
            workload.setLastWorkedStep(lastWorkedStep);
        }
    }

    public void addWorkload(Long periodNumber, Double workload, Double spent, Integer lastWorkedStep) {
        Workload newWorkload = new Workload();
        newWorkload.setPeriodNumber(periodNumber);
        newWorkload.setWorkload(workload);
        newWorkload.setSpentWorkload(spent);
        newWorkload.setLastWorkedStep(lastWorkedStep);
        newWorkload.setIteration(this);
        this.workloads.add(newWorkload);
    }

    /**
     * get replanned workloads consumption
     *
     * @return the planned workloads consumption
     */
    @JsonIgnore
    private Map<Long, Double> getModifiableReplannedWorkloads() {
        return ListUtils.mapEntries(this.replannedWorkloads, new IterationPlanning.Extractor());
    }

    @JsonProperty
    public Map<Long, Double> getReplannedWorkloads() {
        return Collections.unmodifiableMap(this.getModifiableReplannedWorkloads());
    }

    /**
     * set the replanned workloads consumption
     *
     * @param replannedWorkloads
     */
    public void setReplannedWorkloads(Map<Long, Double> replannedWorkloads) {
        this.replannedWorkloads.clear();
        if (replannedWorkloads != null) {
            for (Entry<Long, Double> entry : replannedWorkloads.entrySet()) {
                this.replannedWorkloads.add(new IterationPlanning(entry.getKey(), entry.getValue()));
            }
        }
    }

    /**
     * retrieve the list of tasks composing the iteration
     *
     * @return get all tasks
     */
    public List<TaskInstance> getTasks() {
        return tasks;
    }

    /**
     * set the list of task composing the iteration
     *
     * @param tasks tasks composing the iteration
     */
    public void setTasks(List<TaskInstance> tasks) {
        this.tasks = tasks;
        if (tasks != null) {
            for (TaskInstance taskInstance : tasks) {
                taskInstance.getIterations().add(this);
            }
            this.setTaskNames(null);
        }
    }

    public void addTask(TaskInstance taskD) {
        this.tasks.add(taskD);
        this.setTaskNames(null);
    }

    public void removeTask(TaskInstance task) {
        this.tasks.remove(task);
        this.setTaskNames(null);
    }

    public Set<String> getDeserialisedTaskNames() {
        return taskNames;
    }

    public Set<String> getTaskNames() {
        if (taskNames == null) {
            Set<String> names = new HashSet<>();
            for (TaskInstance ti : getTasks()) {
                names.add(ti.findDescriptor().getName());
            }
            return names;
        } else {
            return taskNames;
        }
    }

    public void setTaskNames(Set<String> names) {
        this.taskNames = names;
    }

    private void internalPlan(Long periodNumber, Double workload, Map<Long, Double> planning) {
        if (workload > 0) {
            planning.put(periodNumber, workload);
        } else {
            planning.remove(periodNumber);
        }
    }

    public void plan(Long periodNumber, Double workload) {
        Map<Long, Double> planning = this.getModifiablePlannedWorkloads();
        internalPlan(periodNumber, workload, planning);
        this.setPlannedWorkloads(planning);
    }

    public void replan(Long periodNumber, Double workload) {
        Map<Long, Double> planning = this.getModifiableReplannedWorkloads();
        internalPlan(periodNumber, workload, planning);
        this.setReplannedWorkloads(planning);
    }

    /**
     * tie lifecycle events with burdownInstnace ones
     */
    /*
    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        return this.getBurndownInstance().getEntities();
    }*/
    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        BurndownInstance theBdI = this.getBurndownInstance();

        if (theBdI != null) {
            theBdI = (BurndownInstance) beans.getVariableInstanceFacade().find(theBdI.getId());
            if (theBdI != null) {
                theBdI.getIterations().remove(this);
            }
        }
        for (TaskInstance task : this.getTasks()) {
            task = (TaskInstance) beans.getVariableInstanceFacade().find(task.getId());
            if (task != null) {
                task.getIterations().remove(this);
            }
        }
        this.setTasks(new ArrayList<>());
    }

    @Override
    public WithPermission getMergeableParent() {
        return getBurndownInstance();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getBurndownInstance().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getBurndownInstance().getRequieredReadPermission();
    }
}
