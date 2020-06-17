/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.AcceptInjection;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Transient;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @param <T> scope context
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity // Database serialization
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "GameModelScope", value = GameModelScope.class),
    @JsonSubTypes.Type(name = "GameScope", value = GameModelScope.class), // force GameScope to be deserialized as GameModelScope
    @JsonSubTypes.Type(name = "TeamScope", value = TeamScope.class),
    @JsonSubTypes.Type(name = "PlayerScope", value = PlayerScope.class)
})
@Table(indexes = {
    @Index(columnList = "variabledescriptor_id")
})
abstract public class AbstractScope<T extends InstanceOwner> extends AbstractEntity implements AcceptInjection {

    /**
     * Convenient way to represent scope types as strings (in database or in REST paths)
     */
    @JsonDeserialize(using = ScopeTypeDeserialiser.class)
    public enum ScopeType {
        PlayerScope,
        TeamScope,
        GameModelScope
    };

    private static final Logger logger = LoggerFactory.getLogger(AbstractScope.class);

    private static final long serialVersionUID = 1L;

    /**
     * HACK
     * <p>
     * Links from VariableDescriptor to Instances has been cut to avoid using time-consuming
     * HashMap. Thereby, a new way to getInstances(player) is required. It's done by using specific
     * named-queries through VariableInstanceFacade.
     * <p>
     * Injecting VariableInstanceFacade here don't bring business logic within data because the very
     * only functionality that is being used here aims to replace JPA OneToMany relationship
     * management
     * <p>
     */
    @JsonIgnore
    @Transient
    private VariableInstanceFacade variableInstanceFacade;

    @JsonIgnore
    @Transient
    private Beanjection beans;

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
    @Column(length = 255)
    @Enumerated(value = EnumType.STRING)
    private ScopeType broadcastScope = ScopeType.PlayerScope;

    /**
     * Instantiate a new scope
     *
     * @param atClass        scopeType
     * @param broadcastScope broadcast type
     *
     * @return the new scope
     */
    public static AbstractScope build(ScopeType atClass, ScopeType broadcastScope) {
        AbstractScope scope;
        switch (atClass) {
            case PlayerScope:
                scope = new PlayerScope();
                break;
            case GameModelScope:
                scope = new GameModelScope();
                break;
            default:
                scope = new TeamScope();
        }
        scope.setBroadcastScope(broadcastScope);
        return scope;
    }

    /**
     * get serialisable type
     *
     * @return
     */
    public abstract ScopeType getScopeType();

    /**
     * @param key
     * @param v
     */
    abstract public void setVariableInstance(T key, VariableInstance v);

    /**
     * @param player
     *
     * @return the variable instance which the player can write
     */
    abstract public VariableInstance getVariableInstance(Player player);

    /**
     * return the first variableInstance which is accessible by the team.
     * <p>
     * here stands the behaviour for playeScoped instance, see overridden methods for other scope
     * behaviour
     *
     * @param team
     *
     * @return a variableInstance a player of the team can write
     */
    public VariableInstance getVariableInstance(Team team) {
        for (Player p : team.getPlayers()) {
            VariableInstance variableInstance = this.getVariableInstance(p);
            if (variableInstance !=null){
                return variableInstance;
            }
        }
        return null;
    }

    /**
     * return the first variableInstance which is accessible by the game
     * <p>
     * here stands the behaviour for playeScoped instance, see overridden methods for other scope
     * behaviour
     *
     * @param game
     *
     * @return a variableInstance a player in the game can write
     */
    public VariableInstance getVariableInstance(Game game) {
        for (Team t : game.getTeams()) {
            VariableInstance vi = this.getVariableInstance(t);
            if (vi != null){
                return vi;
            }
        }
        return null;
    }

    /**
     * return the first variableInstance which is accessible by the gameModel
     * <p>
     * here stands the behaviour for playeScoped instance, see overridden methods for other scope
     * behaviour
     *
     * @param gm
     *
     * @return a variableInstance a player in the gameModel can write
     */
    public VariableInstance getVariableInstance(GameModel gm) {
        for (Game g : gm.getGames()) {
            VariableInstance vi = this.getVariableInstance(g);
            if (vi != null){
                return vi;
            }
        }
        return null;
    }

    /**
     *
     * @return {@link #getVariableInstance(Player)} with the current player
     *
     * @deprecated
     */
    @Deprecated
    @JsonIgnore
    public VariableInstance getInstance() {
        return this.getVariableInstance(this.lookupPlayer());
    }

    /**
     * Propagate instances for the given player
     *
     * @param p      instance owner
     * @param create create new instance or update existing one ?
     */
    protected void propagate(Player p, boolean create){
        // default behaviour is to do nothng, maybe a bad design...
    }

    /**
     * Propagate instances for the given team
     *
     * @param t      the team
     * @param create create new instance or update existing one ?
     */
    protected void propagate(Team t, boolean create) {
        for (Player p : t.getPlayers()) {
            if (!p.isWaiting()) {
                propagate(p, create);
            } else {
                logger.error("SKIP PLAYER: {} -> {}", p, p.getStatus());
            }
        }
    }

    /**
     * Propagate instances for the given Game
     *
     * @param g      the game
     * @param create create new instance or update existing one ?
     */
    protected void propagate(Game g, boolean create) {
        for (Team t : g.getTeams()) {
            if (!t.isWaiting()) {
                propagate(t, create);
            }
        }
    }

    /**
     * Propagate instances for the given GameModel
     *
     * @param gm     the gameModel
     * @param create create new instance or update existing one ?
     */
    protected void propagate(GameModel gm, boolean create) {
        for (Game g : gm.getGames()) {
            propagate(g, create);
        }
    }

    /**
     * Propagate default instance for given context
     *
     * @param context instance (GameModel, Game, Team, Player) to propagate instances to (null means
     *                propagate to everybody)
     * @param create
     */
    abstract public void propagateDefaultInstance(InstanceOwner context, boolean create);

    /**
     * @return the variable descriptor
     */
    // @fixme here we cannot use the back-reference on an abstract reference
    //@JsonBackReference
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
     * @return the scope id
     */
    @Override
    @JsonIgnore
    public Long getId() {
        return this.id;
    }

    /**
     * @return the broadcastScope
     */
    public AbstractScope.ScopeType getBroadcastScope() {
        return broadcastScope;
    }

    /**
     * @param broadcastScope the broadcastScope to set
     */
    public void setBroadcastScope(AbstractScope.ScopeType broadcastScope) {
        this.broadcastScope = broadcastScope;
    }

    @Override
    public void setBeanjection(Beanjection beanjection) {
        this.beans = beanjection;
    }

    /**
     * Since the @ManyToMany HashMap from scope to instances is not effiient, it has been cut and
     * replace by JPA queries. Those queries stands within VariableInstanceFacade so we need
     * something to fetch it... It's not so nice...
     *
     * @return VariableInstanceFacade instance
     */
    protected VariableInstanceFacade getVariableInstanceFacade() {
        // beans should have been injected by EntityListener
        if (this.beans != null && this.beans.getVariableInstanceFacade() != null) {
            return this.beans.getVariableInstanceFacade();
        } else if (this.variableInstanceFacade == null) {
            // but it may not... so here is a lookup fallback
            logger.error("LOOKUP OCCURS : " + this);
            Helper.printWegasStackTrace(new Exception());
            this.variableInstanceFacade = VariableInstanceFacade.lookup();
        }

        return this.variableInstanceFacade;
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getVariableDescriptor();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getVariableDescriptor().getGameModel().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getVariableDescriptor().getGameModel().getRequieredReadPermission();
    }

    /**
     * Missing player arguments ? get it from requestFacade (but please avoid it)
     *
     * @return the current player
     */
    protected Player lookupPlayer() {
        logger.error("LOOKUP OCCURS: {}", this);
        Helper.printWegasStackTrace(new Exception());
        return RequestFacade.lookup().getPlayer();
    }
}
