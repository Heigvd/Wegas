/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import java.io.Serializable;
import java.util.Map;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlID;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonSubTypes;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity                                                                         // Database serialization
@Inheritance(strategy = InheritanceType.JOINED)
@XmlType(name = "Scope")                                                        // JSon Serialisation
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "GameModelScope", value = GameModelScopeEntity.class),
    @JsonSubTypes.Type(name = "GameScope", value = GameModelScopeEntity.class),
    @JsonSubTypes.Type(name = "TeamScope", value = TeamScopeEntity.class),
    @JsonSubTypes.Type(name = "PlayerScope", value = PlayerScopeEntity.class)
})
abstract public class AbstractScopeEntity extends AbstractEntity implements Serializable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @XmlID
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @OneToOne
    @XmlTransient
    //@JsonBackReference
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
     * @param player
     * @return
     */
    @XmlTransient
    abstract public VariableInstanceEntity getVariableInstance(PlayerEntity player);

    /**
     *
     * @return
     */
    abstract public Map<Long, VariableInstanceEntity> getVariableInstances();

    /**
     *
     * @param force
     */
    @XmlTransient
    abstract public void propagateDefaultInstance(boolean force);

    /**
     *
     * @return
     */
    // @fixme here we cannot use the back-reference on an abstract reference
    //@JsonBackReference
    @XmlTransient
    public VariableDescriptorEntity getVariableDescriptor() {
        return this.variableDescriptor;
    }

    /**
     *
     * @param varDesc
     */
    //@JsonBackReference
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
