/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.persistence;

import java.io.Serializable;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
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
// Type name is unique within the game model !
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"belongsto_id", "name"}))
@XmlType(name="UserEvent", propOrder={"id", "name"})
public class GmUserEvent extends NamedEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator="userEvent_seq")
    private Long id;


    @NotNull
    @Pattern(regexp="^\\w*$")
    private String name;


    @ManyToOne
    @XmlTransient
    @NotNull
    private GmType belongsTo;


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


    @XmlTransient
    public GmType getBelongsTo() {
        return belongsTo;
    }


    @XmlTransient
    public void setBelongsTo(GmType belongsTo) {
        this.belongsTo = belongsTo;
    }

    @Override
    @XmlTransient
    public GmType getParent() {
        return belongsTo;
    }


}