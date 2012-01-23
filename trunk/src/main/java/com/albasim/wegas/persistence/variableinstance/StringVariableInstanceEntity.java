/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.persistence.variableinstance;

import java.util.logging.Logger;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

@Entity
        
@XmlType(name = "StringVariableInstance")

public class StringVariableInstanceEntity extends VariableInstanceEntity {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = Logger.getLogger("StringVariableInstanceEntity");
    
    
    private String content;

    /**
     * @return the content
     */
    public String getContent() {
        return content;
    }

    /**
     * @param content the content to set
     */
    public void setContent(String content) {
        this.content = content;
    }
    
   /* @Override
    public VariableInstanceEntity clone() {
        VariableInstanceEntity vi = new  VariableInstanceEntity();
        return vi;
    }*/
}