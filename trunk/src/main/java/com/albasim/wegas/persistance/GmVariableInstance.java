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
import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistance.instance.GmComplexInstance;
import com.albasim.wegas.persistance.instance.GmIntegerInstance;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
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
//@Table(uniqueConstraints =
//@UniqueConstraint(columnNames = {"parentcomplexinstance_id", "parentgamemodel_id", "name"}))
@XmlType(name = "Var", propOrder = {"@class", "id", "name", "type"})
public class GmVariableInstance extends NamedAlbaEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = Logger.getLogger("GMVariableKInstance");


    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "var_instance_seq")
    private Long id;


    @ManyToOne
    @NotNull
    @XmlTransient
    private GmVariableDescriptor descriptor;


    @OneToMany(mappedBy = "variable", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    @XmlTransient
    private List<GmInstance> instances;

    // The node this var belongs to

    @ManyToOne
    @XmlTransient
    private GameModel parentGameModel;


    @ManyToOne
    @XmlTransient
    private GmComplexInstance parentComplexInstance;


    @Transient
    @XmlTransient
    private String stringName;

    // To link the variable to the int instance specified through the 
    // EqualCardinality

    @XmlTransient
    @ManyToOne
    private GmIntegerInstance integerInstance;


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
        return descriptor.getName();
    }


    @Override
    public void setName(String name) {
        this.stringName = name;
    }


    public GmCardinality getCardinality() {
        return this.descriptor.getCardinality();
    }


    @Transient
    @XmlTransient
    public String getStringName() {
        return stringName;
    }


    @XmlElement(name = "instances")
    public Collection<IndexEntry> getInstanceIndex() {
        return AlbaHelper.getIndex(this.instances);
    }


    @XmlTransient
    public GmVariableDescriptor getDescriptor() {
        return descriptor;
    }


    @XmlTransient
    public void setDescriptor(GmVariableDescriptor descriptor) {
        this.descriptor = descriptor;
    }


    @XmlTransient
    public List<GmInstance> getInstances() {
        return instances;
    }


    public void setInstances(List<GmInstance> instances) {
        this.instances = instances;
    }


    @XmlTransient
    public GmComplexInstance getParentComplexInstance() {
        return parentComplexInstance;
    }


    @XmlTransient
    public void setParentComplexInstance(GmComplexInstance parentComplexInstance) {
        this.parentComplexInstance = parentComplexInstance;
    }


    @XmlTransient
    public GameModel getParentGameModel() {
        return parentGameModel;
    }


    @XmlTransient
    public void setParentGameModel(GameModel parentGameModel) {
        this.parentGameModel = parentGameModel;
    }


    @XmlTransient
    @ManyToOne
    public GmIntegerInstance getIntegerInstance() {
        return integerInstance;
    }


    @XmlTransient
    public void setIntegerInstance(GmIntegerInstance integerInstance) {
        this.integerInstance = integerInstance;
    }


    public boolean isInstanceExists(String name) {
        for (GmInstance i : getInstances()) {
            if (i.getName().equals(name)) {
                return true;
            }
        }
        return false;
    }


    @XmlTransient
    public GmInstance lookupInstance(String name) {
        for (GmInstance i : instances) {
            if (i.getName().equals(name)) {
                return i;
            }
        }
        return null;
    }


    @Transient
    @XmlTransient
    public GameModel getGameModel() {
        return descriptor.getGameModel();
    }

    @Override
    @XmlTransient
    public AnonymousAlbaEntity getParent() {
        if (parentComplexInstance != null){
            return parentComplexInstance;
        }
        else if (parentGameModel != null){
            return parentGameModel;
        }
        throw new InvalidContent("Orphan!");
    }



}