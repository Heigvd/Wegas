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
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import javax.persistence.*;
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
    private List<Assignment> assignments = new ArrayList<Assignment>();
    /**
     *
     */
    private Boolean active = true;
    /**
     *
     */
    @ElementCollection
    private Map<String, Long> skillset;
    /**
     *
     */
    @ElementCollection
    private Map<String, String> properties;

    /**
     *
     */
    @Column(length = 4096)
    private String description;
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
        this.setAssignments(other.getAssignments());
        this.setActive(other.getActive());
        this.setAssignments(other.getAssignments());
        this.setDesiredSkill(other.getDesiredSkill());
        this.setProperties(other.getProperties());
        this.setSkillset(other.getSkillset());
        this.setUndesiredSkillset(other.getUndesiredSkillset());
    }

    /**
     * @return the replies
     */
    public List<Assignment> getAssignments() {
        return assignments;
    }

    /**
     * @param replies the replies to set
     */
    public void setAssignments(List<Assignment> assignments) {
        this.assignments = assignments;
    }

    /**
     * @return the active
     */
    public Boolean getActive() {
        return active;
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
        return skillset;
    }

    /**
     * @param skillset the skillset to set
     */
    public void setSkillset(Map<String, Long> skillset) {
        this.skillset = skillset;
    }

    /**
     * @return the properties
     */
    public Map<String, String> getProperties() {
        return properties;
    }

    /**
     * @param properties the properties to set
     */
    public void setProperties(Map<String, String> properties) {
        this.properties = properties;
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
