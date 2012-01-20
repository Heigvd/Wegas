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
package com.albasim.wegas.helper;

import com.albasim.wegas.persistence.GmCardinality;
import com.albasim.wegas.persistence.VariableInstanceEntity;

/**
 *
 * @author maxence
 */
public class VariableInstanceIndexEntry extends IndexEntry {
    
    private String type;

    private GmCardinality cardinality;
    
    public VariableInstanceIndexEntry(VariableInstanceEntity vi){
        super(vi);
        //this.type = vi.getDescriptor().getType().getName();
       // this.cardinality = vi.getCardinality();
    }


    public String getType() {
        return type;
    }


    public void setType(String type) {
        this.type = type;
    }


    public GmCardinality getCardinality() {
        return cardinality;
    }


    public void setCardinality(GmCardinality cardinality) {
        this.cardinality = cardinality;
    }


}
