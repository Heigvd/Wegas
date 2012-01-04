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
import com.albasim.wegas.exception.NotYetImplemented;


import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistance.cardinality.GmEqualCardinality;
import com.albasim.wegas.persistance.cardinality.GmOneCardinality;
import com.albasim.wegas.persistance.instance.GmComplexInstance;
import com.albasim.wegas.persistance.instance.GmIntegerInstance;
import com.albasim.wegas.persistance.type.GmComplexType;
import com.albasim.wegas.persistance.type.GmIntegerType;

import java.io.Serializable;
import java.util.Collection;

import java.util.Iterator;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import javax.persistence.CascadeType;

import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = "name"))
@XmlType(name = "GameModel", propOrder = {"@class", "id", "name"})
public class GameModel extends NamedAlbaEntity implements Serializable {

    private static final Logger logger = Logger.getLogger("GameModelEntity");

    //private static final Pattern p = Pattern.compile("(^get\\()([a-zA-Z0-9_\"]+)(\\)$)");

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gamemodel_seq")
    private Long id;


    @NotNull
    @javax.validation.constraints.Pattern(regexp = "^\\w+$")
    private String name;


    @OneToMany(mappedBy = "parentGameModel", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    Collection<GmVariableDescriptor> variableDescriptors;


    @OneToMany(mappedBy = "parentGameModel", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    Collection<GmVariableInstance> variableInstances;


    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    private List<GmType> types;


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
    public Iterator<GmType> getTypeIterator() {
        return types.iterator();
    }
/*
    public Collection<IndexEntry> getTypeIndex(){
        return AlbaHelper.getIndex(this.getTypes());
    }

    public void setTypeIndex(Collection<IndexEntry> index){
    }

    public Collection<IndexEntry> getVariableDescriptorIndex(){
        return AlbaHelper.getIndex(this.getVariableDescriptors());
    }

    public void setVariableDescriptorIndex(Collection<IndexEntry> index){
    }

    public Collection<IndexEntry> getVariableInstanceIndex(){
        return AlbaHelper.getIndex(this.getVariableInstances());
    }

    public void setVariableInstanceIndex(Collection<IndexEntry> index){
    }
*/



    @XmlTransient
    public Collection<GmType> getTypes() {
        return types;
    }


    //@XmlTransient
    //@XmlElement(nillable=true)
    public void setTypes(List<GmType> types) {
        this.types = types;
    }


    @XmlTransient
    public Collection<GmVariableDescriptor> getVariableDescriptors() {
        return variableDescriptors;
    }


    //@XmlTransient
    //@XmlElement(nillable=true)
    public void setVariableDescriptors(
            Collection<GmVariableDescriptor> variableDescriptors) {
        this.variableDescriptors = variableDescriptors;
    }


    @XmlTransient
    public Collection<GmVariableInstance> getVariableInstances() {
        return variableInstances;
    }


    //@XmlTransient
    //@XmlElement(nillable=true)
    public void setVariableInstances(
            Collection<GmVariableInstance> variableInstances) {
        this.variableInstances = variableInstances;
    }


    @Override
    @XmlTransient
    public AnonymousAlbaEntity getParent() {
        return null;
    }


    @XmlTransient
    public GmType lookupType(String typeName, Class typeClass) {
        for (GmType t : types) {
            if (t.getName().equals(typeName)) {
                if (typeClass != null) {
                    if (typeClass.isInstance(t)) {
                        return t;
                    } else {
                        throw new InvalidContent("Wrong type : " + t.getName() + " <=> " + typeClass.getSimpleName());
                    }
                }
                return t;
            }
        }
        return null;
    }


    @XmlTransient
    public GmVariableInstance lookupVariableInstance(String varName) {
        for (GmVariableInstance vi : this.variableInstances) {
            if (vi.getName().equals(varName)) {
                return vi;
            }
        }
        return null;
    }


    @XmlTransient
    public GmVariableDescriptor lookupDescriptor(String varName) {
        for (GmVariableDescriptor vd : this.variableDescriptors) {
            if (vd.getName().equals(varName)) {
                return vd;
            }
        }
        return null;
    }


    /**
     * Does the soft reference, expressed by 'v', a valid IntegerInstance path ?
     * 
     * Basic pattern of the ref is :
     *    varaname to access a one-cardinalized Integer(sub)Typed variable descriptor from the game model
     *    this.carname to access a one-cardinalized Integer(sub)Typed variable descriptor from the complex type
     * 
     * 
     * @param v 
     * @param cType shall not be null if the variable descriptor which define 
     *              the ref belongs to a complex type, null if it belongs 
     *              to the game model
     * @return 
     */
    @XmlTransient
    public boolean isReferencingAnInt(String v, GmComplexType cType) {
        logger.log(Level.INFO, "Is Referencing an int ? {0}", v);
        String[] split = v.split("\\.");
        for (String s : split) {
            logger.log(Level.INFO, " -> {0}", s);
        }
        if (split.length > 0) {
            int current = 0;

            String varName;

            GmVariableDescriptor theVd = null;
            if (split[current].equals("this")) {
                logger.log(Level.INFO, "This.?");
                // The var shall be one the type
                current++;
                varName = split[current];
                if (cType == null) {
                    // So the complex type cannot be null !
                    throw new InvalidContent("CType is null and the ref starts with \"this\"!");
                }
                theVd = cType.lookupDescriptor(varName);
            } else {
                logger.log(Level.INFO, "global.?");
                // The var shall be one the global
                varName = split[current];
                theVd = this.lookupDescriptor(varName);
            }

            if (theVd == null) {
                throw new InvalidContent("Couldn't resolve \"" + varName + "\"");
            } else {
                if (theVd.getCardinality() instanceof GmOneCardinality
                        && theVd.getType() instanceof GmIntegerType) {
                    return true;
                }
            }
        }

        return false;
    }


    /**
     *  According to isReferencingAnInt, this method resolve the reference and
     *  return the specified IntegerInstance.
     * 
     * @param theVar is the equal-carinalized variable instance
     * @return 
     */
    @XmlTransient
    public GmIntegerInstance resolveIntInstance(GmVariableInstance theVar) {

        GmVariableDescriptor descriptor = theVar.getDescriptor();
        GmCardinality cardinality = descriptor.getCardinality();

        // Make sure the cardinality is OK
        if (cardinality instanceof GmEqualCardinality) {
            GmEqualCardinality eqCard = (GmEqualCardinality) cardinality;
            String value = eqCard.getV();

            String[] split = value.split("\\.");
            if (split.length > 0) {
                GmVariableInstance lookupInstance;

                // 1) Fetch the specified variable instance
                if (split[0].equals("this")) {
                    String varName = split[1];
                    GmComplexInstance parent = theVar.getParentComplexInstance();
                    if (parent != null) {
                        lookupInstance = parent.lookupVariableInstance(varName);
                    } else {
                        throw new InvalidContent("Ref to int is invalid : no such parent complex type");
                    }
                } else {
                    String varName = split[0];
                    GameModel gameModel = theVar.getGameModel();
                    lookupInstance = gameModel.lookupVariableInstance(varName);
                }


                // Make sure the variable instance is usable in this context
                if (lookupInstance != null) {
                    if (lookupInstance.getCardinality() instanceof GmOneCardinality) {
                        if (!lookupInstance.getInstances().isEmpty()) {
                            GmInstance get = lookupInstance.getInstances().get(0);
                            if (get instanceof GmIntegerInstance) {
                                GmIntegerInstance instance = (GmIntegerInstance) get;
                                return instance;
                            } else {
                                throw new InvalidContent("Target instance is not an integer one !");
                            }
                        } else {
                            throw new InvalidContent("Target varaible has no instances !");
                        }
                    } else {
                        throw new NotYetImplemented("For the time, can only resolve simple reference");
                    }
                } else {
                    throw new InvalidContent("No such variable: " + value);
                }
            } else {
                throw new InvalidContent("Reference is empty!");
            }
        } else {
            throw new InvalidContent("DONT USE WITH OTHER THAN EQUAL CARDINALITY");
        }
    }


}
