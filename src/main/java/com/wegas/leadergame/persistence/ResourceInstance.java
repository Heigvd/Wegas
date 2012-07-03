/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.leadergame.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.CascadeType;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class ResourceInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToMany(mappedBy = "resourceInstance", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference
    private List<Assignment> assignments;
    /**
     *
     */
    private Boolean active = true;
    /**
     * 
     */
    private int moral = 100;
    /**
     *
     */
    @ElementCollection
    private Map<String, Long> skillset = new HashMap<>();
    /**
     *
     */
    @ElementCollection
    private Map<String, String> properties = new HashMap<>();
    /**
     *
     */
    private String desiredSkill;
    /**
     *
     */
    private String undesiredSkillset;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        ResourceInstance other = (ResourceInstance) a;
        this.setActive(other.getActive());

        if (other.getAssignments() != null) {
            this.setAssignments(other.getAssignments());
        }
        this.skillset.clear();
        this.skillset.putAll(other.getSkillset());
        this.properties.clear();
        this.properties.putAll(other.getProperties());
        this.setDesiredSkill(other.getDesiredSkill());
        this.setUndesiredSkillset(other.getUndesiredSkillset());
    }

    /**
     * @return the replies
     */
    public List<Assignment> getAssignments() {
        return assignments;
    }

    /**
     * @param assignments
     */
    public void setAssignments(List<Assignment> assignments) {
        this.assignments = assignments;
    }

    /**
     *
     * @param assignment
     */
    public void addAssignement(Assignment assignment) {
        this.assignments.add(assignment);
        assignment.setResourceInstance(this);
    }
    /**
     *
     * @param task
     * @param startTime
     */
    public void assign(Long startTime, TaskDescriptor task) {
        this.addAssignement(new Assignment(startTime, task));
    }


    /**
     * @return the active
     */
    public Boolean getActive() {
        return this.active;
    }

    /**
     * @param active the active to set
     */
    public void setActive(Boolean active) {
        this.active = active;
    }

    /**
     * @return the skillset
     */
    public Map<String, Long> getSkillset() {
        return this.skillset;
    }

    /**
     * @param skillset the skillset to set
     */
    public void setSkillset(Map<String, Long> skillset) {
        this.skillset = skillset;
    }

    /**
     *
     * @param key
     * @param val
     */
    public void setSkillset(String key, Long val) {
        this.skillset.put(key, val);
    }

    /**
     *
     * @param key
     * @return
     */
    public Long getSkillset(String key) {
        return this.skillset.get(key);
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
     * @param val
     */
    public void setProperty(String key, String val) {
        this.properties.put(key, val);
    }

    /**
     *
     * @param key
     * @return
     */
    public String getProperty(String key) {
        return this.properties.get(key);
    }

    /**
     * @return the desiredSkill
     */
    public String getDesiredSkill() {
        return desiredSkill;
    }

    /**
     * @param desiredSkill the desiredSkill to set
     */
    public void setDesiredSkill(String desiredSkill) {
        this.desiredSkill = desiredSkill;
    }

    /**
     * @return the undesiredSkillset
     */
    public String getUndesiredSkillset() {
        return undesiredSkillset;
    }

    /**
     * @param undesiredSkillset the undesiredSkillset to set
     */
    public void setUndesiredSkillset(String undesiredSkillset) {
        this.undesiredSkillset = undesiredSkillset;
    }

    /**
     * @return the moral
     */
    public int getMoral() {
        return moral;
    }

    /**
     * @param moral the moral to set
     */
    public void setMoral(int moral) {
        this.moral = moral;
    }
}
