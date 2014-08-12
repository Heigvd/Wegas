/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import javax.persistence.Entity;
import javax.persistence.Transient;
import javax.xml.bind.annotation.XmlTransient;
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
}
