/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class StringDescriptor extends VariableDescriptor<StringInstance> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(StringDescriptor.class);
    /**
     *
     */
    //@NotNull
    //@Pattern(regexp = "^\\w*$")
    private String validationPattern;

    @ElementCollection
    private List<String> allowedValues = new ArrayList<>();

    /**
     *
     */
    public StringDescriptor() {
    }

    /**
     *
     * @param name
     */
    public StringDescriptor(String name) {
        this.name = name;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        StringDescriptor other = (StringDescriptor) a;
        this.setValidationPattern(other.getValidationPattern());

        this.allowedValues.clear();
        this.allowedValues.addAll(other.getAllowedValues());
        super.merge(a);

        String value = this.getDefaultInstance().getValue();
        if (!this.isValueAllowed(value)) {
            throw WegasErrorMessage.error("Value \"" + value + "\" not allowed !");
        }
    }

    /**
     * @return the validationPattern
     */
    public String getValidationPattern() {
        return validationPattern;
    }

    /**
     * @param validationPattern the validationPattern to set
     */
    public void setValidationPattern(String validationPattern) {
        this.validationPattern = validationPattern;
    }

    /**
     * get allowed values
     *
     * @return
     */
    public List<String> getAllowedValues() {
        return allowedValues;
    }

    /**
     * set allowed values
     *
     * @param allowedValues
     */
    public void setAllowedValues(List<String> allowedValues) {
        this.allowedValues = allowedValues;
    }

    /*
     * SUGARY 
     */
    /**
     *
     * @param p
     * @return
     */
    public String getValue(Player p) {
        return this.getInstance(p).getValue();
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setValue(Player p, String value) {
        this.getInstance(p).setValue(value);
    }

    public boolean isValueAllowed(String value) {
        return allowedValues == null || allowedValues.isEmpty() || value.isEmpty() || allowedValues.contains(value);
    }
}
