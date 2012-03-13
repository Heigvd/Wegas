/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.scope;

import com.wegas.core.persistence.game.AbstractEntity;
import com.wegas.core.persistence.variabledescriptor.VariableDescriptorEntity;
import com.wegas.core.persistence.variableinstance.VariableInstanceEntity;
import java.io.Serializable;
import java.util.Map;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlID;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.apache.commons.lang.NotImplementedException;
import org.codehaus.jackson.annotate.JsonBackReference;
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
    @JsonSubTypes.Type(name = "GameModelScope", value = GameModelScopeEntity.class),
    @JsonSubTypes.Type(name = "GameScope", value = GameModelScopeEntity.class),
    @JsonSubTypes.Type(name = "TeamScope", value = TeamScopeEntity.class),
    @JsonSubTypes.Type(name = "PlayerScope", value = PlayerScopeEntity.class)
})
public class ScopeEntity extends AbstractEntity implements Serializable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @XmlID
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "scope_seq")
    private Long id;
    //abstract public void getVariableInstance(UserEntity u);
    /**
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
    public void setVariableInstance(Long userId, VariableInstanceEntity v) {
    }

    /**
     *
     * @param userId
     * @return
     */
    @XmlTransient
    public VariableInstanceEntity getVariableInstance(Long userId) {
        throw new NotImplementedException();
    }

    /**
     *
     * @return
     */
    public Map<Long, VariableInstanceEntity> getVariableInstances() {
        throw new NotImplementedException();
    }

    /**
     *
     * @param force
     */
    @XmlTransient
    public void propagateDefaultVariableInstance(boolean force) {
    }

    /**
     *
     * @return
     */
    @JsonBackReference("variabledescriptor-scope")
    public VariableDescriptorEntity getVariableDescriptor() {
        return this.variableDescriptor;
    }

    /**
     *
     * @param varDesc
     */
    @JsonBackReference("variabledescriptor-scope")
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

    @Override
    public void merge(AbstractEntity a) {
    }
    /*
     * @Override public void reset(){}
     */
}
