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

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.persistence.GmInstance;
import com.albasim.wegas.persistence.type.GmStringType;
import javax.persistence.Entity;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlRootElement
@XmlType(name="StringI")
public class GmStringInstance extends GmInstance {
    private String v;


    public String getV() {
        return v;
    }


    public void setV(String v) {
        this.v = v;
    }

    @PrePersist
    @PreUpdate
    void checkStringValue(){
        GmStringType type = (GmStringType) this.getInstanceOf();
        if (!type.isValid(v)){
            throw new InvalidContent("String value (" + getId() + ") doesn't match pattern " + type.getPattern());
        }
    }
            
}
