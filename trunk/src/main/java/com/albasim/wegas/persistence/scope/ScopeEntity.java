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

import com.albasim.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.albasim.wegas.persistence.variableinstance.VariableInstanceEntity;
import com.albasim.wegas.persistence.*;
import java.io.Serializable;
import java.util.Map;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.JoinColumn;
import javax.persistence.MapsId;
import javax.persistence.OneToOne;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.eclipse.persistence.oxm.annotations.XmlInverseReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
// Database serialization
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
// JSon Serialisation
@XmlType(name = "Scope")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "UserScope", value = UserScopeEntity.class)
})
public abstract class ScopeEntity extends AnonymousEntity implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "scope_seq")
    // @XmlTransient
    private Long id;
    //abstract public void getVariableInstance(UserEntity u);
 /*   @OneToOne(mappedBy="scope")
    @NotNull
    @XmlTransient
    @JsonBackReference*7
     * 
     */
    
    @OneToOne
    @XmlTransient
    private VariableDescriptorEntity variableDescriptor;
    
    abstract public void setVariableInstances(Long userId, VariableInstanceEntity v);

    abstract public Map<Long, VariableInstanceEntity> getVariableInstances();

   /*@OneToOne
    @JoinColumn(name = "variabledescriptor_id")
    @XmlInverseReference(mappedBy = "scope")
    @XmlTransient*/
    @OneToOne
    @XmlTransient
    public VariableDescriptorEntity getVariableDescriptor() {
        return this.variableDescriptor;
    }

    public void setVariableDescscriptor(VariableDescriptorEntity varDesc) {
        this.variableDescriptor = varDesc;
    }

    @Override
    public Long getId() {
        return this.id;
    }

    @Override
    public void setId(Long id) {
        this.id = id;
    }
}
