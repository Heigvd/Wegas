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

import com.albasim.wegas.exception.DatabaseInconsistence;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.persistence.GmEnumItem;
import com.albasim.wegas.persistence.GmInstance;
import com.albasim.wegas.persistence.GmType;
import com.albasim.wegas.persistence.type.GmEnumType;
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
@XmlType(name = "EnumI")
public class GmEnumInstance extends GmInstance {

    private String v;


    public String getV() {
        return v;
    }


    public void setV(String v) {
        this.v = v;
    }


    @Override
    public GmEnumType getInstanceOf() {
        GmType instanceOf = super.getInstanceOf();
        if (instanceOf instanceof GmEnumType) {
            return (GmEnumType) instanceOf;
        }
        throw new DatabaseInconsistence("Enum Instance Type is not EnumType");
    }


    @PrePersist
    @PreUpdate
    void validate() {
        GmEnumType type = getInstanceOf();
        // TODO replace by SQL query !
        StringBuilder list = new StringBuilder();

        // Does the value belongs to the enumeration ? 
        for (GmEnumItem it : type.getItems()){
            list.append(it.getName());
            list.append(", ");
            if (it.getName().equalsIgnoreCase(v)){
                return;
            }
        }
        int length = list.length();
        list.delete(length-3, length);
        throw new InvalidContent("Value is not valid. Please select one of [" + list.toString() + "]");
    }


}
