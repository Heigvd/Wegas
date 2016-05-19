/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;

import javax.persistence.*;
import java.util.Map;

////import javax.xml.bind.annotation.XmlTransient;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity                                                                         // Database serialization
@JsonSubTypes(value = {
        @JsonSubTypes.Type(name = "GameModelScope", value = GameModelScope.class),
        @JsonSubTypes.Type(name = "GameScope", value = GameScope.class),
        @JsonSubTypes.Type(name = "TeamScope", value = TeamScope.class),
        @JsonSubTypes.Type(name = "PlayerScope", value = PlayerScope.class)
})
@Table(indexes = {
        @Index(columnList = "variableinstance_variableinstance_id")
})
abstract public class AbstractScope extends AbstractEntity {

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
     */
    //@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
    @JsonView(Views.EditorExtendedI.class)
    private String broadcastScope = PlayerScope.class.getSimpleName();

    /**
     * @param key
     * @param v
     */
    abstract public void setVariableInstance(Long key, VariableInstance v);

    /**
     * @param player
     * @return
     */
    abstract public VariableInstance getVariableInstance(Player player);

    /**
     * @return
     */
    @JsonView(Views.Editor.class)
    abstract public Map<Long, VariableInstance> getVariableInstances();

    /**
     * @return The variable instance associated to the current player, which is
     *         stored in the RequestManager.
     */
    @JsonView(Views.SinglePlayerI.class)
    //@XmlAttribute(name = "variableInstances")
    abstract public Map<Long, VariableInstance> getPrivateInstances();

    /**
     * @return
     */
    //@XmlTransient
    @JsonIgnore
    public VariableInstance getInstance() {
        return this.getVariableInstance(RequestFacade.lookup().getPlayer());
    }

    /**
     * Propagate instances for the given player
     *
     * @param p instance owner
     */
    protected void propagate(Player p) {
    }

    /**
     * Propagate instances for the given team
     *
     * @param t the team
     */
    protected void propagate(Team t) {
        for (Player p : t.getPlayers()) {
            propagate(p);
        }
    }

    /**
     * Propagate instances for the given Game
     *
     * @param g the game
     */
    protected void propagate(Game g) {
        for (Team t : g.getTeams()) {
            propagate(t);
        }
    }

    /**
     * Propagate instances for the given GameModel
     *
     * @param gm the gameModel
     */
    protected void propagate(GameModel gm) {
        for (Game g : gm.getGames()) {
            propagate(g);
        }
    }

    /**
     * Propagate default instance for given context
     *
     * @param context instance (GameModel, Game, Team, Player) to propagate
     *                instances to (null means propagate to everybody)
     */
    abstract public void propagateDefaultInstance(AbstractEntity context);

    /**
     * @return
     */
    // @fixme here we cannot use the back-reference on an abstract reference
    //@JsonBackReference
    //@XmlTransient
    @JsonIgnore
    public VariableDescriptor getVariableDescriptor() {
        return this.variableDescriptor;
    }

    /**
     * @param varDesc
     */
    //@JsonBackReference
    public void setVariableDescscriptor(VariableDescriptor varDesc) {
        this.variableDescriptor = varDesc;
    }

    /**
     * @return
     */
    @Override
    //@XmlTransient
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
