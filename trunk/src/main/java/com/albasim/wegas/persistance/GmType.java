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

import com.albasim.wegas.helper.MethodDescriptor;
import com.albasim.wegas.persistance.type.GmBooleanType;
import com.albasim.wegas.persistance.type.GmComplexType;
import com.albasim.wegas.persistance.type.GmDoubleType;
import com.albasim.wegas.persistance.type.GmEnumType;
import com.albasim.wegas.persistance.type.GmIntegerType;
import com.albasim.wegas.persistance.type.GmMediaType;
import com.albasim.wegas.persistance.type.GmStringType;
import com.albasim.wegas.persistance.type.GmTextType;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.xml.bind.annotation.XmlElement;

import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonSubTypes;

/**
 *
 * @author maxence
 */
@Entity
// Database Serialization
// Type name is unique within the game model !
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"gamemodel_id", "name"}))
@Inheritance(strategy = InheritanceType.JOINED)
// Client serialization
@XmlType(name = "Type", propOrder = {"@class", "id", "name", "availableEvents", "userEvents", "prototypes", "methods"})
//@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "BooleanT", value = GmBooleanType.class),
    @JsonSubTypes.Type(name = "ComplexT", value = GmComplexType.class),
    @JsonSubTypes.Type(name = "DoubleT", value = GmDoubleType.class),
    @JsonSubTypes.Type(name = "EnumT", value = GmEnumType.class),
    @JsonSubTypes.Type(name = "IntegerT", value = GmIntegerType.class),
    @JsonSubTypes.Type(name = "MediaT", value = GmMediaType.class),
    @JsonSubTypes.Type(name = "StringT", value = GmStringType.class),
    @JsonSubTypes.Type(name = "TextT", value = GmTextType.class)
})
public abstract class GmType extends NamedAlbaEntity implements Serializable {

    private static final long serialVersionUID = 1L;
    protected static final Logger logger = Logger.getLogger("GMTYPE");

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "type_seq")
    private Long id;


    @NotNull
    @Pattern(regexp="^[A-Z]\\w+$") // i.e. alphanumeric + _ starting by a caps
    private String name;


    /**
     * The game model this belongs to
     */
    @ManyToOne
    @NotNull
    @XmlTransient
    private GameModel gameModel;


    @OneToMany(mappedBy = "belongsTo", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    @XmlTransient
    private List<GmMethod> methods; // Method list 


    @OneToMany(mappedBy = "belongsTo", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    @XmlTransient // Hide the sub-resources to XML
    private List<GmUserEvent> userEvents;


    // shall removing a type destroy all var desc of this type ???  
    @OneToMany(mappedBy = "type"/*, cascade={CascadeType.REMOVE}*/) 
    @XmlTransient
    private List<GmVariableDescriptor> descriptors;

    
    @OneToMany(mappedBy = "instanceOf", fetch = FetchType.LAZY)
    @XmlTransient
    private List<GmInstance> gmInstances; // lists all instances of this type



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


    @XmlElement(nillable = true)
    public List<String> getAvailableEvents() {
        List<String> list = new ArrayList<String>();
        for (MethodDescriptor md : getPrototypes()) {
            list.add("before_" + md.getName());
            list.add("after_" + md.getName());
        }
        if (userEvents != null) {
            for (GmUserEvent ue : userEvents) {
                list.add(ue.getName());
            }
        }

        return list;
    }


    @XmlElement
    public List<MethodDescriptor> getPrototypes() {
        List<MethodDescriptor> list = new ArrayList<MethodDescriptor>();
        List<GmMethod> mtds = getMethods();

        Logger logger = Logger.getLogger("Authoring_GM_Type :: getProto");

        logger.log(Level.INFO, " start");

        if (mtds != null) {
            logger.log(Level.INFO, " go through methods");
            for (GmMethod m : mtds) {
                MethodDescriptor mD = new MethodDescriptor(m.getName(), m.getReturnType());

                for (GmParameter p : m.getParameters()) {
                    mD.addParam(p.getName(), p.getType());
                }

                list.add(mD);
            }
        }
        return list;
    }


    public void setGameModel(GameModel gm) {
        this.gameModel = gm;
    }


    @XmlTransient
    public GameModel getGameModel() {
        return gameModel;
    }


    @XmlTransient
    public List<GmMethod> getMethods() {
        return methods;
    }


    @XmlTransient
    public List<GmUserEvent> getUserEvents() {
        return userEvents;
    }


    public void setMethods(List<GmMethod> methods) {
        this.methods = methods;
    }


    @XmlTransient
    public void setUserEvents(List<GmUserEvent> userEvents) {
        this.userEvents = userEvents;
    }


    @XmlTransient
    public List<GmInstance> getGmInstances() {
        return gmInstances;
    }


    @XmlTransient
    public void setGmInstances(List<GmInstance> gmInstances) {
        this.gmInstances = gmInstances;
    }


    @XmlTransient
    public List<GmVariableDescriptor> getDescriptors() {
        return descriptors;
    }


    public void setDescriptors(List<GmVariableDescriptor> descs) {
        this.descriptors = descs;
    }

    @XmlTransient
    public String getInstanceType(){
        XmlType annotation = this.getClass().getAnnotation(XmlType.class);
        return annotation.name().replaceAll("T$", "I");
    }


    public abstract GmInstance createInstance(String name, GmVariableInstance vi,
                              GmEnumItem aThis);


    @Override
    @XmlTransient
    public GameModel getParent() {
        return gameModel;
    }
}
