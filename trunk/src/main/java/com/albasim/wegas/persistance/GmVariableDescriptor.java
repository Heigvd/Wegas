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

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;


import com.albasim.wegas.persistance.cardinality.GmUnboundedCardinality;
import com.albasim.wegas.persistance.type.GmComplexType;

import java.io.Serializable;

import java.util.List;

import java.util.logging.Level;
import java.util.logging.Logger;


import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.persistence.UniqueConstraint;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;

import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
//@EntityListeners({GmVariableDescriptorListener.class})
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"parentcomplextype_id", "parentgamemodel_id", "name"}))
@XmlType(name = "VarDesc", propOrder = {"@class", "id", "name", "type", "cardinality"})
public class GmVariableDescriptor extends NamedAlbaEntity implements Serializable {

    private static final long serialVersionUID = 1L;


    private static final Logger logger = Logger.getLogger("GMVariableDescriptor");


    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "var_desc_seq")
    private Long id;


    @NotNull
    @Pattern(regexp = "^\\w*$")
    private String name;


    @NotNull
    @ManyToOne
    @XmlTransient
    private GmType type;


    /* hibernate ? */
    /* var desc belongs to */
    @ManyToOne
    @XmlTransient
    private GameModel parentGameModel;


    /* var desc belongs to */
    @ManyToOne
    @XmlTransient
    private GmComplexType parentComplexType;


    @NotNull
    @OneToOne(cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    private GmCardinality cardinality;


    /*
     * Variable creation is magic throug CarDesc creation
     */
    @OneToMany(mappedBy = "descriptor", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    @XmlTransient
    private List<GmVariableInstance> gmVariableInstances;


    @Transient
    @XmlTransient
    private String stringType;


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


    public GmCardinality getCardinality() {
        return cardinality;
    }


    public void setCardinality(GmCardinality cardinality) {
        this.cardinality = cardinality;
    }


    /*
     * HACK : this is the way json is deserialized
     */
    @XmlElement(name = "type")
    public String getStringType() {
        if (type != null) {
            return type.getName();
        } else {
            return "N/A";
        }
    }


    public void setStringType(String type) {
        logger.log(Level.INFO, "HITS setType: {0}", type);
        this.stringType = type;
    }


    /* - - - -  XML TRANSIENT - - - - */
    @XmlTransient
    public String getRealStringType() {
        return this.stringType;
    }


    @XmlTransient
    public GmType getType() {
        return type;
    }


    @XmlTransient
    public void setType(GmType type) {
        this.type = type;
    }


    @XmlTransient
    public List<GmVariableInstance> getGmVariableInstances() {
        return gmVariableInstances;
    }


    @XmlTransient
    public void setGmVariableInstances(
            List<GmVariableInstance> gmVariableInstances) {
        this.gmVariableInstances = gmVariableInstances;
    }


    @XmlTransient
    public GmComplexType getParentComplexType() {
        return parentComplexType;
    }


    @XmlTransient
    public void setParentComplexType(GmComplexType parentComplexType) {
        if (parentComplexType != null) {
            this.parentComplexType = parentComplexType;
            this.parentGameModel = null;
        }
    }


    @XmlTransient
    public GameModel getParentGameModel() {
        return parentGameModel;
    }


    @XmlTransient
    public void setParentGameModel(GameModel parentGameModel) {
        if (parentGameModel != null) {
            this.parentGameModel = parentGameModel;
            this.parentComplexType = null;
        }
    }


    @XmlTransient
    public GameModel getGameModel() {

        if (this.parentGameModel != null) {
            return this.parentGameModel;
        } else if (this.getParentComplexType() != null) {
            return this.parentComplexType.getGameModel();
        }
        throw new NotFound();
    }


    @XmlTransient
    public boolean canAddInstance() {
        GmCardinality card = this.getCardinality();
        if (card instanceof GmUnboundedCardinality) {
            return true;
        }

        return false;
    }


    public boolean canRemoveInstance() {
        return canAddInstance();
    }


    public boolean canChangeInstanceName() {
        return getCardinality() instanceof GmUnboundedCardinality;
    }


    @Override
    @XmlTransient
    public AnonymousAlbaEntity getParent() {
        if (parentComplexType != null) {
            return parentComplexType;
        } else if (parentGameModel != null) {
            return parentGameModel;
        }
        throw new InvalidContent("Orphan!");
    }


}
