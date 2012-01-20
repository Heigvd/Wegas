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
package com.albasim.wegas.persistence;

import com.albasim.wegas.persistence.cardinality.GmEnumCardinality;
import com.albasim.wegas.persistence.cardinality.GmEqualCardinality;
import com.albasim.wegas.persistence.cardinality.GmOneCardinality;
import com.albasim.wegas.persistence.cardinality.GmUnboundedCardinality;
import java.io.Serializable;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.OneToOne;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonSubTypes;

/**
 *
 * @author maxence
 */
// Database serialization
@Entity
@Inheritance(strategy = InheritanceType.JOINED)

// JSon Serialisation

@XmlType(name = "Cardinality")
//@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "Enum", value = GmEnumCardinality.class),
    @JsonSubTypes.Type(name = "Equal", value = GmEqualCardinality.class),
    @JsonSubTypes.Type(name = "One", value = GmOneCardinality.class),
    @JsonSubTypes.Type(name = "Unbounded", value = GmUnboundedCardinality.class)
    //@JsonSubTypes.Type(name = "UpTo", value = GmUpToCardinality.class)
})
public abstract class GmCardinality extends AnonymousEntity implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy= GenerationType.SEQUENCE, generator="cardinality_seq")
    @XmlTransient
    private Long id;

    @Override
    @XmlTransient
    public Long getId() {
        return id;
    }

    @Override
    @XmlTransient
    public void setId(Long id) {
        this.id = id;
    }
/*
    @OneToOne(mappedBy = "cardinality")
    @XmlTransient
    @NotNull
    private VariableDescriptorEntity varDesc;*/

    @XmlTransient
    public VariableDescriptorEntity getVarDesc() {
        return null;
    }


    public void setVarDesc(VariableDescriptorEntity varDesc) {
        //this.varDesc = varDesc;
    }

    public abstract boolean requestInstanceSelector();
 
    @Override
    public AnonymousEntity getParent() {
        return null;
    }   
}
