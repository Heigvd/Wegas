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
package com.albasim.wegas.persistance;

import com.albasim.wegas.persistance.instance.GmComplexInstance;
import java.io.Serializable;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.PreUpdate;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlType(name = "EventListener")
public class GmEventListener extends NamedAlbaEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "eventlistener_seq")
    private Long id;


    @ManyToOne
    @XmlTransient
    @NotNull
    private GmComplexInstance gmComplexInstance; // belongs to


    @XmlElement(name = "eventPath")
    private String name; // Event path 
    // Path can start with one of Gm Variables or this type variables or this type available events


    private String body; // the script


    @Override
    public Long getId() {
        return id;
    }


    @Override
    public void setId(Long id) {
        this.id = id;
    }


    public String getBody() {
        return body;
    }


    public void setBody(String body) {
        this.body = body;
    }


    @Override
    public String getName() {
        return name;
    }


    @Override
    public void setName(String name) {
        this.name = name;
    }


    @XmlTransient
    public GmComplexInstance getGmComplexInstance() {
        return gmComplexInstance;
    }


    @XmlTransient
    public void setGmComplexInstance(GmComplexInstance gmComplexInstance) {
        this.gmComplexInstance = gmComplexInstance;
    }
    
    @PreUpdate
    public void validatePreUpdate(){
        validateEventPathAndBody();
    }
            
    public void validateEventPathAndBody() {
        // TODO 
    }


    @Override
    @XmlTransient
    public AnonymousAlbaEntity getParent() {
        return getGmComplexInstance();
    }


}
