/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.Access;
import javax.persistence.AccessType;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.Table;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Access(AccessType.FIELD)

/*@Table(indexes = {
    @Index(columnList = "properties.objectinstance_variableinstance_id")
})*/
public class ObjectInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @ElementCollection
    private Map<String, String> properties = new HashMap<>();

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        ObjectInstance other = (ObjectInstance) a;
        this.properties.clear();
        this.properties.putAll(other.getProperties());
//        this.setActive(other.getActive());
//        if (other.getAssignments() != null) {
//            this.setAssignments(other.getAssignments());
//        }
//        this.skillset.clear();
//        this.skillset.putAll(other.getSkillset());
//        this.properties.clear();
//        this.properties.putAll(other.getProperties());
//        this.setDesiredSkill(other.getDesiredSkill());
//        this.setUndesiredSkillset(other.getUndesiredSkillset());
//        this.setMoral(other.getMoral());
//        this.setConfidence(other.getConfidence());
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
}
