/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.persistence.VariableProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.Propertable;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.List;
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
public class ObjectInstance extends VariableInstance implements Propertable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @ElementCollection
    @JsonIgnore
    private List<VariableProperty> properties = new ArrayList<>();

    @Override
    @JsonIgnore
    public List<VariableProperty> getInternalProperties() {
        return this.properties;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a != null) {
            if (a instanceof ObjectInstance) {
                super.merge(a);
                ObjectInstance other = (ObjectInstance) a;
                this.setProperties(other.getProperties());
            } else {
                throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
            }
        }
    }
}
