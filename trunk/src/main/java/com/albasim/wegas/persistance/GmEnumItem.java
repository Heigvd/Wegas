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

import com.albasim.wegas.persistance.type.GmEnumType;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
//@EntityListeners(value={GmEnumItemListener.class})
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"gmenumtype_id", "name"}))
@XmlType(name = "EnumItem")
public class GmEnumItem extends NamedAlbaEntity {

    public static final Logger logger = Logger.getLogger("EnumItem");

    private static final long serialVersionUID = 1L;


    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "enumitem_seq")
    private Long id;


    @NotNull
    @Pattern(regexp = "^\\w+$")
    private String name;


    //@NotNull
    //private Integer position;
    @ManyToOne
    @XmlTransient
    @NotNull
    private GmEnumType gmEnumType;


    @XmlTransient
    @OneToMany(mappedBy = "enumItem", cascade = {CascadeType.PERSIST, CascadeType.MERGE, CascadeType.REMOVE})
    private List<GmInstance> instances;


    @Override
    public Long getId() {
        return id;
    }


    @Override
    public void setId(Long id) {
        this.id = id;
    }


    @Override
    public String getName() {
        return name;
    }


    @Override
    public void setName(String name) {
        this.name = name;
    }


    //public Integer getPosition() {
    //    return position;
    //}
    //public void setPosition(Integer position) {
    //    this.position = position;
    //}
    @XmlTransient
    public GmEnumType getGmEnumType() {
        return gmEnumType;
    }


    @XmlTransient
    public void setGmEnumType(GmEnumType gmEnumType) {
        this.gmEnumType = gmEnumType;
    }


    @XmlTransient
    public List<GmInstance> getInstances() {
        return instances;
    }


    @XmlTransient
    public void setInstances(List<GmInstance> instances) {
        this.instances = instances;
    }


    @Override
    @XmlTransient
    public GmEnumType getParent() {
        return getGmEnumType();
    }


}
