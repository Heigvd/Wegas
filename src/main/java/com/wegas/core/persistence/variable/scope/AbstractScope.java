/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.io.Serializable;
import java.util.Map;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.annotate.JsonSubTypes;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity                                                                         // Database serialization
@Inheritance(strategy = InheritanceType.JOINED)                                           // JSon Serialisation
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "GameModelScope", value = GameModelScope.class),
    @JsonSubTypes.Type(name = "GameScope", value = GameModelScope.class),
    @JsonSubTypes.Type(name = "TeamScope", value = TeamScope.class),
    @JsonSubTypes.Type(name = "PlayerScope", value = PlayerScope.class)
})
abstract public class AbstractScope extends AbstractEntity implements Serializable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @OneToOne
    //@JsonBackReference
    private VariableDescriptor variableDescriptor;

    /**
     *
     * @param userId
     * @param v
     */
    abstract public void setVariableInstance(Long userId, VariableInstance v);

    /**
     *
     * @param player
     * @return
     */
    abstract public VariableInstance getVariableInstance(Player player);

    /**
     *
     * @return
     */
    abstract public Map<Long, VariableInstance> getVariableInstances();

    /**
     *
     * @param force
     */
    abstract public void propagateDefaultInstance(boolean force);

    /**
     *
     * @return
     */
    // @fixme here we cannot use the back-reference on an abstract reference
    //@JsonBackReference
    @XmlTransient
    @JsonIgnore
    public VariableDescriptor getVariableDescriptor() {
        return this.variableDescriptor;
    }

    /**
     *
     * @param varDesc
     */
    //@JsonBackReference
    public void setVariableDescscriptor(VariableDescriptor varDesc) {
        this.variableDescriptor = varDesc;
    }

    /**
     *
     * @return
     */
    @Override
    @XmlTransient
    @JsonIgnore
    public Long getId() {
        return this.id;
    }
}
