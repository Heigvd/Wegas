/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.Access;
import javax.persistence.AccessType;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
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
        if (a != null) {
            if (a instanceof ObjectInstance) {
                ObjectInstance other = (ObjectInstance) a;
                this.setProperties(new HashMap<>());
                this.getProperties().putAll(other.getProperties());
            } else {
                throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
            }
        }
    }

    public boolean hasProperty(String property) {
        return this.properties.containsKey(property);
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
     *
     * @param key
     * @return
     */
    public double getPropertyD(String key) {
        return Double.valueOf(this.properties.get(key));
    }

}
