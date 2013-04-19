/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity                                                                         // Database serialization
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "GameModelScope", value = GameModelScope.class),
    @JsonSubTypes.Type(name = "GameScope", value = GameScope.class),
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

    //@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
    private String broadcastScope = TeamScope.class.getSimpleName();

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
    @JsonView(Views.Editor.class)
    abstract public Map<Long, VariableInstance> getVariableInstances();

    /**
     *
     * @return The variable instance associated to the current player, which is
     * stored in the RequestManager.
     */
    @JsonView(Views.SinglePlayerI.class)
    //@XmlAttribute(name = "variableInstances")
    public Map<Long, VariableInstance> getPrivateInstances() {
        Map<Long, VariableInstance> ret = new HashMap<>();
        RequestFacade rmf = RequestFacade.lookup();

        Long id = Long.valueOf(0);
        if (this instanceof TeamScope) {
            id = rmf.getPlayer().getTeam().getId();
        } else if (this instanceof PlayerScope) {
            id = rmf.getPlayer().getId();
        }

        ret.put(id, this.getVariableInstance(rmf.getPlayer()));

        return ret;
    }

    /**
     *
     * @return
     */
    @XmlTransient
    public VariableInstance getInstance() {
        return this.getVariableInstance(RequestFacade.lookup().getPlayer());
    }

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

    /**
     * @return the broadcastScope
     */
    public String getBroadcastScope() {
        return broadcastScope;
    }

    /**
     * @param broadcastScope the broadcastScope to set
     */
    public void setBroadcastScope(String broadcastScope) {
        this.broadcastScope = broadcastScope;
    }
}
