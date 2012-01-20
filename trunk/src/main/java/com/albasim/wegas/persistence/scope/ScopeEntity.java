/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.persistence.scope;

import com.albasim.wegas.persistence.*;
import com.albasim.wegas.persistence.users.UserEntity;
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
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
// Database serialization
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
// JSon Serialisation
@XmlType(name = "Scope")
//@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "UserScope", value = UserScopeEntity.class)
})
public abstract class ScopeEntity extends AnonymousEntity implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "scope_seq")
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
    @OneToOne(mappedBy = "scope")
    @NotNull
    private VariableDescriptorEntity varDesc;

    @XmlTransient
    public VariableDescriptorEntity getVarDesc() {
        return this.varDesc;
    }

    public void setVarDesc(VariableDescriptorEntity varDesc) {
        this.varDesc = varDesc;
    }

    abstract public void setVariableInstance(UserEntity u, VariableInstanceEntity v);

    @Override
    public AnonymousEntity getParent() {
        return null;
    }
}
