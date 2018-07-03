/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.VariableProperty;
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
 @Index(columnList = "properties.objectinstance_id")
 })*/
public class ObjectInstance extends VariableInstance implements Propertable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @ElementCollection
    @JsonIgnore
    @WegasEntityProperty
    private List<VariableProperty> properties = new ArrayList<>();

    @Override
    @JsonIgnore
    public List<VariableProperty> getInternalProperties() {
        return this.properties;
    }

}
