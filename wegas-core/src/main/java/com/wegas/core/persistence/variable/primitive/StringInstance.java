/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.io.IOException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.Entity;
import java.util.List;

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class StringInstance extends VariableInstance implements Searchable {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(StringInstance.class);

    private String val;

    /**
     *
     */
    public StringInstance() {
    }

    /**
     * @param value
     */
    public StringInstance(String value) {
        this.val = value;
    }

    /**
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        StringInstance vi = (StringInstance) a;
        this.setValue(vi.getValue());
    }

    /**
     * @return the value
     */
    public String getValue() {
        return val;
    }

    /**
     * @param value the value to set
     */
    public void setValue(String value) {
        VariableDescriptor vd = this.findDescriptor();
        if (vd instanceof StringDescriptor && value != null) {
            StringDescriptor sd = (StringDescriptor) vd;
            String[] values;

            try {
                ObjectMapper mapper = new ObjectMapper();
                values = mapper.readValue(value, TypeFactory.defaultInstance().constructArrayType(String.class));

            } catch (IOException ex) {
                values = new String[1];
                values[0] = value;
            }

            for (String v : values) {
                if (!sd.isValueAllowed(v)) {
                    throw WegasErrorMessage.error("Value \"" + value + "\" not allowed !");
                }
            }
        }

        this.val = value;
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        return Helper.insensitiveContainsAll(this.getValue(), criterias);
    }
}
