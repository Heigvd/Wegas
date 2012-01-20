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

import com.albasim.wegas.persistence.instance.GmBooleanInstance;
import com.albasim.wegas.persistence.instance.GmComplexInstance;
import com.albasim.wegas.persistence.instance.GmDoubleInstance;
import com.albasim.wegas.persistence.instance.GmEnumInstance;
import com.albasim.wegas.persistence.instance.GmIntegerInstance;
import com.albasim.wegas.persistence.instance.GmMediaInstance;
import com.albasim.wegas.persistence.instance.GmStringInstance;
import com.albasim.wegas.persistence.instance.GmTextInstance;
import java.io.Serializable;
import java.util.logging.Logger;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
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
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"variable_id", "name"}))
@Inheritance(strategy = InheritanceType.JOINED)
//@XmlRootElement
@XmlType(name = "Instance")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "BooleanI", value = GmBooleanInstance.class),
    @JsonSubTypes.Type(name = "ComplexI", value = GmComplexInstance.class),
    @JsonSubTypes.Type(name = "DoubleI", value = GmDoubleInstance.class),
    @JsonSubTypes.Type(name = "EnumI", value = GmEnumInstance.class),
    @JsonSubTypes.Type(name = "IntegerI", value = GmIntegerInstance.class),
    @JsonSubTypes.Type(name = "MediaI", value = GmMediaInstance.class),
    @JsonSubTypes.Type(name = "StringI", value = GmStringInstance.class),
    @JsonSubTypes.Type(name = "TextI", value = GmTextInstance.class)
})
public abstract class GmInstance extends NamedEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = Logger.getLogger("Instance");

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "instance_seq")
    private Long id;


    @NotNull
    @Pattern(regexp = "^\\w+$")
    @XmlElement(name = "alias")
    private String name;  // TODO think about that... 


    @XmlTransient
    @ManyToOne
    private GmEnumItem enumItem;


    @ManyToOne
    @XmlTransient
    @NotNull
    private GmType instanceOf;


    @ManyToOne
    @XmlTransient
    @NotNull
    private VariableInstanceEntity variable; // belongs to a varaible instance


    @Override
    public Long getId() {
        return id;
    }


    @Override
    public void setId(Long id) {
        this.id = id;
    }


    @Override
    @XmlTransient
    public String getName() {
        return name;
    }

    @Override
    @XmlTransient
    public void setName(String name) {
        this.name = name;
    }

    public void setAlias(String alias){
        this.name = alias;
    }

    public String getAlias(){
        return name;
    }

    @XmlTransient
    public GmType getInstanceOf() {
        return instanceOf;
    }


    @XmlTransient
    public void setInstanceOf(GmType instanceOf) {
        this.instanceOf = instanceOf;
    }


    @XmlTransient
    public VariableInstanceEntity getVariable() {
        return variable;
    }


    @XmlTransient
    public void setVariable(VariableInstanceEntity variable) {
        this.variable = variable;
    }


    @XmlTransient
    public GmEnumItem getEnumItem() {
        return enumItem;
    }


    @XmlTransient
    public void setEnumItem(GmEnumItem enumItem) {
        this.enumItem = enumItem;
    }


    @Override
    @XmlTransient
    public VariableInstanceEntity getParent() {
        return variable;
    }
}
