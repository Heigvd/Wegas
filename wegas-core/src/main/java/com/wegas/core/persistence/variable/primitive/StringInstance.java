/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.io.IOException;
import java.util.List;
import javax.persistence.Entity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
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
        if (a instanceof StringInstance) {
            StringInstance vi = (StringInstance) a;
            super.merge(a);
            this.setValue(vi.getValue());
        } else {
            throw new WegasIncompatibleType(a + " is not instanceof StringInstance");
        }
    }

    /**
     * @return the value
     */
    public String getValue() {
        return val;
    }

    /**
     * convert the strValue to array
     *
     * @param strValue
     *
     * @return
     */
    public String[] parseValues(String strValue) {
        String[] values;

        try {
            ObjectMapper mapper = new ObjectMapper();
            values = mapper.readValue(strValue, TypeFactory.defaultInstance().constructArrayType(String.class));

        } catch (IOException ex) {
            values = new String[1];
            values[0] = strValue;
        }
        return values;
    }

    /**
     * Value can be a string "as-is", or JSON array of string.
     * <p>
     * If the StringDescriptor defines some allowed values, the as-is value or
     * each string in the array must equal one of the allowed values. Otherwise,
     * a WegasErrorMessage is therown.
     *
     * @param value the value to set
     */
    public void setValue(String value) {
        VariableDescriptor vd = this.findDescriptor();
        if (vd instanceof StringDescriptor && value != null) {
            StringDescriptor sd = (StringDescriptor) vd;
            String[] values = this.parseValues(value);
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
