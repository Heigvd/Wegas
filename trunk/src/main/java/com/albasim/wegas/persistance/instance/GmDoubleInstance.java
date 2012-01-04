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
package com.albasim.wegas.persistance.instance;

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.persistance.GmInstance;
import com.albasim.wegas.persistance.type.GmDoubleType;
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
@XmlType(name = "DoubleI")
public class GmDoubleInstance extends GmInstance {

    private Double v;


    public Double getV() {
        return v;
    }


    public void setV(Double v) {
        this.v = v;
    }


    @PrePersist
    @PreUpdate
    void checkValue() {
        GmDoubleType type = (GmDoubleType) this.getInstanceOf();
        if (!type.checkValue(this.v)) {
            throw new InvalidContent("Double value out of range");
        }
    }


}
