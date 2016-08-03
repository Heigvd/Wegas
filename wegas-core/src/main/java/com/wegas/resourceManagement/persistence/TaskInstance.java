/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.exception.client.WegasOutOfBoundException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import javax.persistence.CascadeType;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.Transient;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity

/*@Table(indexes = {

    @Index(columnList = "plannification.taskinstance_variableinstance_id"),
    @Index(columnList = "properties.taskinstance_variableinstance_id")
})*/
public class TaskInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    private boolean active = true;
    /**
     *
     */
    @Transient
    private Double duration;
    /**
     *
     */
    @ElementCollection
    private List<Integer> plannification = new ArrayList<>();
    /**
     *
     */
    @ElementCollection
    private Map<String, String> properties = new HashMap<>();
    /**
     *
     */
    @OneToMany(mappedBy = "taskInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    //@JoinColumn(referencedColumnName = "variableinstance_id")
    private List<WRequirement> requirements = new ArrayList<>();

    /**
     * @return the active
     */
    public boolean getActive() {
        return this.active;
    }

    /**
     * @param active the active to set
     */
    public void setActive(boolean active) {
        this.active = active;
    }

    /**
     * @return the duration
     */
    @JsonIgnore
    public Double getDuration() {
        return duration;
    }

    /**
     * @deprecated moved as instance property, setter kept for old JSON backward
     * compatibility
     * @param duration the duration to set
     */
    @JsonProperty
    public void setDuration(double duration) {
        if (duration < 0.0) {
            throw new WegasOutOfBoundException(0L, null, duration, "duration");
        } else {
            this.duration = duration;
        }
    }

    /**
     * @return the plannification
     */
    public List<Integer> getPlannification() {
        return plannification;
    }

    /**
     * @param plannification the plannification to set
     */
    public void setPlannification(List<Integer> plannification) {
        this.plannification = plannification;
    }

    /**
     * @return the properties
     */
    public Map<String, String> getProperties() {
        return this.properties;
    }

    /**
     * @param properties the properties to set
     */
    public void setProperties(Map<String, String> properties) {
        this.properties = properties;
    }

    /**
     *
     * @param key
     * @return the instance property mapped by the given key
     */
    public String getProperty(String key) {
        return this.properties.get(key);
    }

    /**
     *
     * @param key
     * @return the instance property mapped by the given key, double castes
     */
    public double getPropertyD(String key) {
        return Double.valueOf(this.properties.get(key));
    }

    /**
     *
     * @param index
     * @return WRequirement
     */
    public WRequirement getRequirement(Integer index) {
        return this.requirements.get(index);
    }

    /**
     *
     * @param id
     * @return requirement matching given id
     */
    public WRequirement getRequirementById(Long id) {
        WRequirement requirement = null;
        for (WRequirement req : this.getRequirements()) {
            if (Objects.equals(req.getId(), id)) {
                requirement = req;
                break;
            }
        }
        return requirement;
    }

    public WRequirement getRequirementByName(String name) {
        WRequirement requirement = null;
        for (WRequirement req : this.getRequirements()) {
            if (req.getName().equals(name)) {
                requirement = req;
                break;
            }
        }
        return requirement;
    }

    /**
     * @return the requirements
     */
    public List<WRequirement> getRequirements() {
        return this.requirements;
    }

    /**
     * @param requirements the requirement to set
     */
    public void setRequirements(List<WRequirement> requirements) {
        this.requirements = requirements;
        for (WRequirement req : requirements) {
            req.setTaskInstance(this);
        }
    }

    /**
     *
     * @param index
     * @param val
     */
    public void setRequirement(Integer index, WRequirement val) {
        this.getRequirements().set(index, val);
        val.setTaskInstance(this);
    }

    public void addRequirement(WRequirement req) {
        this.getRequirements().add(req);
        req.setTaskInstance(this);
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof TaskInstance) {
            super.merge(a);
            TaskInstance other = (TaskInstance) a;
            this.setActive(other.getActive());
            //this.setDuration(other.getDuration());
            this.setProperties(new HashMap<>());
            this.getProperties().putAll(other.getProperties());
            ListUtils.ListKeyToMap<Object, WRequirement> converter;
            converter = new WRequirementToNameConverter();

            this.setRequirements(ListUtils.mergeLists(this.getRequirements(), other.getRequirements(), converter));

            /*
            Map<String, WRequirement> reqMap = ListUtils.listAsMap(requirements, converter);
            this.setRequirements(new ArrayList<>());
            for (WRequirement req : other.getRequirements()) {
                WRequirement r;
                if (reqMap.containsKey(req.getName()) && req.getId() != null) {
                    r = reqMap.get(req.getName());
                    r.merge(req);
                    this.getRequirements().add(r);
                } else {
                    r = new WRequirement();
                    r.merge(req);
                    r.setTaskInstance(this);
                    this.getRequirements().add(r);
                }
            }*/
            this.setPlannification(new ArrayList<>());
            this.getPlannification().addAll(other.getPlannification());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    /**
     *
     * @param key
     * @param val
     */
    public void setProperty(String key, String val) {
        this.properties.put(key, val);
    }

    private static class WRequirementToNameConverter implements ListUtils.ListKeyToMap<Object, WRequirement> {

        @Override
        public String getKey(WRequirement item) {
            return item.getName();
        }
    }
}
