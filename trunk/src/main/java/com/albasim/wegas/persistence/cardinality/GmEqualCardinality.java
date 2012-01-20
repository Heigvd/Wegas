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
package com.albasim.wegas.persistence.cardinality;

import com.albasim.wegas.persistence.GmCardinality;

import java.util.logging.Logger;

import javax.persistence.Entity;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlType(name = "Equal")
public class GmEqualCardinality extends GmCardinality {

    private static final Logger logger = Logger.getLogger("GmEqualCardinality");

    @XmlElement(name = "value")
    private String v;


    @XmlTransient
    public String getV() {
        return v;
    }


    public void setV(String v) {
        this.v = v;
    }

    @Override
    public boolean requestInstanceSelector() {
        return true;
    }
}
