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
package com.albasim.wegas.persistence.instance;

import com.albasim.wegas.persistence.GmInstance;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlRootElement
@XmlType(name="BooleanI")
public class GmBooleanInstance extends GmInstance {
    private Boolean v;


    public boolean isV() {
        return v;
    }


    public void setV(Boolean v) {
        this.v = v;
    }

    
}

