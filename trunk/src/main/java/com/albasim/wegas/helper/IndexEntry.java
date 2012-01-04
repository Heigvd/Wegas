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

import com.albasim.wegas.persistance.NamedAlbaEntity;
import javax.xml.bind.annotation.XmlAttribute;
import javax.xml.bind.annotation.XmlElement;

import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;


/**
 *
 * @author maxence
 */
@XmlRootElement
@XmlType(name="Index", propOrder={"@class", "id", "name"})
public class IndexEntry {

    @XmlElement
    private Long id;

    @XmlElement
    private String name;
    
    @XmlAttribute(name="@class")
    private String type;
    
    public IndexEntry(NamedAlbaEntity e) {
        this.id = e.getId();
        this.name = e.getName();

        // Fetch class name from the XmlType annotation
        XmlType annotation = e.getClass().getAnnotation(XmlType.class);
        this.type = annotation.name();
    }

    public IndexEntry(){
    }


    public Long getId() {
        return id;
    }


    public void setId(Long id) {
        this.id = id;
    }


    public String getName() {
        return name;
    }


    public void setName(String name) {
        this.name = name;
    }


    @XmlTransient
    public String getType() {
        return type;
    }


    @XmlTransient
    public void setType(String type) {
        this.type = type;
    }


}
