/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableDescriptor;
import javax.persistence.Entity;
import javax.persistence.Transient;
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
	super.merge(a);
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
     * get default value. PDF Export Sugar
     *
     * @return default value
     */
    @Transient
    public String getDefaultValue() {
	return this.getDefaultInstance().getValue();
    }
}
