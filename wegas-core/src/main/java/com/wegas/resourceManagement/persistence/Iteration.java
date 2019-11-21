/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.JSONSchema.ListOfTasksSchema;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.EmptyString;
import com.wegas.editor.View.Hidden;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
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

    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    //@JsonIgnore
    @Transient
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        view = @View(label = "Task names", value = Hidden.class),
        schema = ListOfTasksSchema.class
    )
    private Set<String> taskNames;

    /**
     *
     */
    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(label = "Create Time", value = Hidden.class)
    )
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date createdTime = new Date();

    /**
     * Iteration Name
     */
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyString.class,
        view = @View(label = "Name"))
    private String name;

    /**
     * Period number the iteration shall start on
     */
    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(label = "Begin at"))
    private Long beginAt;

    /**
     * SPI-like indicator, based on workloads. WSPI
     */
    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(label = "WSPI"))
    private Double wspi;

    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(label = "CPI"))
    private Double cpi;

    /**
     * maps a period number with workload for past period and current one: indicates the total remaining workload for
     * the corresponding period.
     */
    @OneToMany(mappedBy = "iteration", cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        view = @View(label = "periods"))
    private List<IterationPeriod> periods = new ArrayList<>();

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
     * Get the schedule Performance Index based on workloads
     *
     * @return the WSPI
     */
    public Double getWspi() {
        return wspi;
    }

    /**
     * Set the schedule Performance Index
     *
     * @param wspi
     */
    public void setWspi(Double wspi) {
        this.wspi = wspi;
    }

    @JsonIgnore
    private Long getLastPlannedPeriod() {
        Long max = 0l;
        List<IterationPeriod> periods = getPeriods();
        for (IterationPeriod ip : periods) {
            if (ip.getPw() != null && ip.getPw() > 0) {
                if (ip.getPeriodNumber() > max) {
                    max = ip.getPeriodNumber();
                }
            }
        }
        return max + beginAt;
    }

    /**
     * very PMG Related
     *
     * @return true is any of its task is started or if any periods has EW gt 0
     */
    @JsonIgnore
    public Boolean isStarted() {
        for (IterationPeriod period : this.getPeriods()) {
            if (period.getEw() != null && period.getEw() > 0) {
                return true;
            }
        }
        for (TaskInstance ti : this.getTasks()) {
            if (ti.getPropertyD("completeness") > 0) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get total workload, based on effective tasks
     *
     * @return
     */
    @JsonIgnore
    public Double getTotalWorkload() {

        Double total = 0.0;

        for (TaskInstance taskInstance : getTasks()) {
            if (taskInstance.getActive()) {
                Double duration = taskInstance.getPropertyD("duration");
                Double sumQuantity = 0.0;
                for (WRequirement req : taskInstance.getRequirements()) {
                    sumQuantity += req.getQuantity();
                }
                total += duration * sumQuantity;
            }
        }

        return total;
    }

    /**
     * Get total workload, based periods delta
     *
     * @return
     */
    @JsonIgnore
    public Double getTotalDeltas() {

        Double total = 0.0;

        for (IterationPeriod p : getPeriods()) {
            Double dWl = p.getDeltaAtStart();
            if (dWl != null) {
                total += dWl;
            }
        }

        return total;
    }

    @JsonIgnore
    public Boolean hasAnyEw() {
        for (IterationPeriod p : getPeriods()) {
            Double ew = p.getEw();
            if (ew != null && ew > 0) {
                return true;
            }
        }
        return false;
    }

    @JsonIgnore
    public Double getPlannedWorkload(Double upTo) {
        double upToPeriod = Math.floor(upTo);

        if (Math.abs(upTo - upToPeriod) > 0.01) {
            Double prevPv = this.getPlannedWorkload(upToPeriod);
            Double nextPv = this.getPlannedWorkload(Math.ceil(upTo));
            Double delta = upTo - upToPeriod;
            return prevPv + delta * (nextPv - prevPv);
        } else {
            Double total = 0.0;
            double dUpTo = upToPeriod - this.beginAt;

            for (IterationPeriod p : getPeriods()) {
                if (p.getPeriodNumber() < dUpTo) {
                    Double pw = p.getPlanned();
                    if (pw != null) {
                        total += pw;
                    }
                }
            }

            double totalWl = this.getTotalWorkload();
            if (total >= totalWl) {
                Long lastPlannedPeriod = getLastPlannedPeriod();
                if (upToPeriod > lastPlannedPeriod + 1) {
                    total += (upToPeriod - lastPlannedPeriod - 1) * total / (lastPlannedPeriod - beginAt + 1);
                }
            }
            return total;
        }
    }

    /**
     * get iteration periods
     *
     * @return get periods
     */
    public List<IterationPeriod> getPeriods() {
        return periods;
    }

    public IterationPeriod getPeriod(Long periodNumber) {
        for (IterationPeriod ip : this.periods) {
            if (ip.getPeriodNumber().equals(periodNumber)) {
                return ip;
            }
        }
        return null;
    }

    /**
     * set effective workloads
     *
     * @param workloads
     */
    public void setPeriods(List<IterationPeriod> periods) {
        this.periods = periods;
        if (this.periods != null) {
            for (IterationPeriod ip : periods) {
                ip.setIteration(this);
            }
        }
    }

    public IterationPeriod getOrCreatePeriod(Long periodNumber) {
        IterationPeriod p = getPeriod(periodNumber);
        if (p == null) {
            p = new IterationPeriod();
            p.setPeriodNumber(periodNumber);
            p.setIteration(this);
            this.periods.add(p);
        }
        return p;
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

    public void plan(Long periodNumber, Double workload) {
        IterationPeriod period = getOrCreatePeriod(periodNumber);
        period.setPlanned(workload);
    }

    public void replan(Long periodNumber, Double workload) {
        IterationPeriod period = getOrCreatePeriod(periodNumber);
        period.setReplanned(workload);
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
