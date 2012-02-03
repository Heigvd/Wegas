/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.persistence.variabledescriptor;



import java.util.logging.Logger;

import javax.persistence.Entity;


import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity

@XmlType(name = "StringVariableDescriptor")
public class StringVariableDescriptorEntity extends VariableDescriptorEntity {

    private static final long serialVersionUID = 1L;
    
    private static final Logger logger = Logger.getLogger("GMVariableDescriptor");

    //@NotNull
    //@Pattern(regexp = "^\\w*$")
    private String validationPattern;

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
}
