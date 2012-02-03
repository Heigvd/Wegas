/*
 * MetAlbasim is super koool. http://www.albasim.com
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 *
 * MetAlbasim is distributed under the ??? license
 *
 */
package com.wegas.helper;

import com.wegas.persistence.variableinstance.VariableInstanceEntity;

/**
 *
 * @author maxence
 */
public class VariableInstanceIndexEntry extends IndexEntry {
    
    private String type;

    
    /**
     * 
     * @param vi
     */
    public VariableInstanceIndexEntry(VariableInstanceEntity vi){
      //  super(vi);
        //this.type = vi.getDescriptor().getType().getName();
       // this.cardinality = vi.getCardinality();
    }


    /**
     * 
     * @return
     */
    public String getType() {
        return type;
    }


    /**
     * 
     * @param type
     */
    public void setType(String type) {
        this.type = type;
    }
}
