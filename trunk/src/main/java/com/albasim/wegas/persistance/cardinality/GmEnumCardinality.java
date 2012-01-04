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
package com.albasim.wegas.persistance.cardinality;

import com.albasim.wegas.persistance.GmCardinality;
import com.albasim.wegas.persistance.type.GmEnumType;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.Transient;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlType(name = "Enum")
public class GmEnumCardinality extends GmCardinality {

    @ManyToOne
    @XmlTransient
    @NotNull
    private GmEnumType enumeration;


    @Transient
    @XmlElement(name = "enum")
    private String enumName;


    @XmlTransient
    public GmEnumType getEnumeration() {
        return enumeration;
    }


    @XmlTransient
    public void setEnumeration(GmEnumType enumeration) {
        this.enumeration = enumeration;
    }


    public String getEnumName() {
        return enumeration.getName();
    }


    public void setEnumName(String enumName) {
        this.enumName = enumName;
    }


    @XmlTransient
    public String getStringEnumName() {
        return this.enumName;
    }

    @Override
    public boolean requestInstanceSelector() {
        return true;
    }
}
  
        
