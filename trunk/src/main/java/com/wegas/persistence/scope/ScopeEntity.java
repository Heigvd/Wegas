/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.persistence.scope;

import com.wegas.ejb.AnonymousEntityManager;
import com.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.wegas.persistence.variableinstance.VariableInstanceEntity;
import com.wegas.persistence.*;
import java.io.Serializable;
import java.util.Map;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.OneToOne;
import javax.xml.bind.annotation.XmlID;
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
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "UserScope", value = UserScopeEntity.class),
    @JsonSubTypes.Type(name = "TeamScope", value = TeamScopeEntity.class),
    @JsonSubTypes.Type(name = "GameModelScope", value = GameModelScopeEntity.class),
    @JsonSubTypes.Type(name = "GameScope", value = GameModelScopeEntity.class)
})
public abstract class ScopeEntity extends AnonymousEntity implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @XmlID
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "scope_seq")
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

    /**
     * 
     * @param userId
     * @param v
     */
    @XmlTransient
    abstract public void setVariableInstance(Long userId, VariableInstanceEntity v);
    
    /**
     * 
     * @param userId
     * @return  
     */
    @XmlTransient
    abstract public VariableInstanceEntity getVariableInstance(Long userId);

    /**
     * 
     * @return
     */
    abstract public Map<Long, VariableInstanceEntity> getVariableInstances();

    /**
     * 
     */
    @XmlTransient
    abstract public void reset(AnonymousEntityManager aem);

    /*@OneToOne
    @JoinColumn(name = "variabledescriptor_id")
    @XmlInverseReference(mappedBy = "scope")
    @XmlTransient*/
    /**
     * 
     * @return
     */
    @XmlTransient
    public VariableDescriptorEntity getVariableDescriptor() {
        return this.variableDescriptor;
    }

    /**
     * 
     * @param varDesc
     */
    @XmlTransient
    public void setVariableDescscriptor(VariableDescriptorEntity varDesc) {
        this.variableDescriptor = varDesc;
    }

    /**
     * 
     * @return
     */
    @Override
    @XmlTransient
    public Long getId() {
        return this.id;
    }

    /**
     * 
     * @param id
     */
    @Override
    @XmlTransient
    public void setId(Long id) {
        this.id = id;
    }

}
