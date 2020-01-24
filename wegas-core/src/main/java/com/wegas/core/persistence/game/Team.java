/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.*;
import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.WegasEntityPermission;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.Textarea;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.Map;
import javax.persistence.Basic;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.JoinColumn;
import javax.persistence.Lob;
import javax.persistence.ManyToOne;
import javax.persistence.NamedQuery;
import javax.persistence.OneToMany;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(
    uniqueConstraints = @UniqueConstraint(columnNames = {"name", "gameteams_id"}),
    indexes = {
        @Index(columnList = "gameteams_id"),
        @Index(columnList = "createdby_id")
    }
)
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "DebugTeam", value = DebugTeam.class)
})

@NamedQuery(name = "Team.findByGameIdAndName", query = "SELECT a FROM Team a WHERE a.name = :name AND a.gameTeams.game.id = :gameId")

@NamedQuery(name = "Team.findToPopulate", query = "SELECT a FROM Team a WHERE a.status LIKE 'WAITING' OR a.status LIKE 'RESCHEDULED'")
public class Team extends AbstractEntity implements Broadcastable, InstanceOwner, DatedEntity, Populatable {

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
    @NotNull
    @Basic(optional = false)
    @WegasEntityProperty(view = @View(label = "Name"))
    private String name;

    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date createdTime = new Date();

    /**
     *
     */
    @Enumerated(value = EnumType.STRING)
    @Column(length = 24, columnDefinition = "character varying(24) default 'WAITING'::character varying")
    private Status status = Status.WAITING;

    /**
     *
     */
    @Lob
    @JsonView(value = Views.EditorI.class)
    @WegasEntityProperty(view = @View(label = "Notes", value = Textarea.class))
    private String notes;

    /**
     * Team size as declared by its creator.
     */
    private Integer declaredSize;

    /**
     *
     */
    @OneToMany(mappedBy = "team", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference(value = "player-team")
    private List<Player> players = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "team", cascade = CascadeType.ALL)
    private List<VariableInstance> privateInstances = new ArrayList<>();

    /**
     * The game this team belongs to
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    @JsonIgnore
    private GameTeams gameTeams;

    @ManyToOne(fetch = FetchType.LAZY)
    private User createdBy;

    @Transient
    private User createdBy_transient;

    /**
     *
     * @Column(name = "parentgame_id", nullable = false, insertable = false, updatable = false)
     * private Long gameId;
     */
    /**
     *
     */
    public Team() {
    }

    /**
     * @param name
     */
    public Team(String name) {
        this.name = name;
    }

    /**
     * @param name
     * @param declaredSize
     */
    public Team(String name, int declaredSize) {
        this.name = name;
        this.declaredSize = declaredSize;
    }

    @JsonIgnore
    public User getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(User createdBy_transient) {
        if (createdBy_transient == null) {
            this.createdBy = null;
        }
        this.createdBy_transient = createdBy_transient;
    }

    @PrePersist
    public void prePersist() {
        // setting createdBy is only allowed before team is actually presisted
        this.createdBy = createdBy_transient;
        if (createdBy != null) {
            createdBy.getTeams().add(this);
        }
    }

    public GameTeams getGameTeams() {
        return gameTeams;
    }

    public void setGameTeams(GameTeams gameTeams) {
        this.gameTeams = gameTeams;
    }

    /**
     * @return the gameModel
     */
    @JsonBackReference(value = "game-team")
    public Game getGame() {
        if (getGameTeams() != null) {
            return getGameTeams().getGame();
        } else {
            return null;
        }
    }

    /**
     * @param game the gameModel to set
     */
    @JsonBackReference(value = "game-team")
    public void setGame(Game game) {
        this.setGameTeams(game.getGameTeams());
    }

    /**
     * @return the players
     */
    @JsonManagedReference(value = "player-team")
    @Override
    @WegasExtraProperty(optional = false, nullable = false, view = @View(label = "Players", value = Hidden.class))
    public List<Player> getPlayers() {
        return players;
    }

    @JsonIgnore
    @Override
    public Player getUserLivePlayer(User user) {
        for (Player p : this.getPlayers()) {
            Player theP = p.getUserLivePlayer(user);
            if (theP != null) {
                return theP;
            }
        }
        return null;
    }

    @JsonIgnore
    @Override
    public Player getAnyLivePlayer() {
        for (Player p : this.getPlayers()) {
            if (p.getStatus().equals(Populatable.Status.LIVE)) {
                return p;
            }
        }
        return null;
    }


    @JsonIgnore
    @Override
    public Player getTestPlayer() {
        if (this instanceof DebugTeam) {
            return this.getAnyLivePlayer();
        }
        return null;
    }

    @JsonIgnore
    @Override
    public GameModel getGameModel() {
        return this.getGame().getGameModel();
    }

    /**
     * @param p
     */
    @JsonIgnore
    public void addPlayer(Player p) {
        this.players.add(p);
        p.setTeam(this);
        //p.setTeamId(this.getId());
    }

    /**
     * @param players the players to set
     */
    @JsonManagedReference(value = "player-team")
    public void setPlayers(List<Player> players) {
        this.players = players;
    }

    @Override
    public String toString() {
        return this.name;
    }

    @Override
    public Long getId() {
        return id;
    }

    /**
     * @return the team name
     */
    public String getName() {
        return name;
    }

    /**
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     *
     * @return teacher notes
     */
    public String getNotes() {
        return notes;
    }

    /**
     *
     * @param notes
     */
    public void setNotes(String notes) {
        this.notes = notes;
    }

    /**
     * @return the gameId
     */
    public Long getGameId() {
        return (getGame() != null ? getGame().getId() : null);
    }

    /**
     *
     * @param gameId public void setGameId(Long gameId) { this.gameId = gameId; }
     */
    /**
     * @return the createdTime
     */
    @Override
    public Date getCreatedTime() {
        return createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    /**
     * @param createdTime the createdTime to set
     */
    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    @Override
    public Status getStatus() {
        return status;
    }

    @Override
    public void setStatus(Status status) {
        this.status = status;
    }

    public Integer getDeclaredSize() {
        return declaredSize == null ? 0 : declaredSize;
    }

    /**
     * @param declaredSize the declaredSize to set
     */
    public void setDeclaredSize(Integer declaredSize) {
        this.declaredSize = declaredSize;
    }

    /**
     * @return String, the name of the game
     */
    @JsonView(value = Views.ExtendedI.class)
    public String getGameName() {
        return this.getGame().getName();
    }

    /**
     * @return boolean, free if the game is played individualy, false if the game is played in team
     */
    @JsonView(value = Views.ExtendedI.class)
    public boolean getGameFreeForAll() {
        return this.getGame().getProperties().getFreeForAll();
    }

    /**
     * @return String, the representation for the icon of the game
     */
    @JsonView(value = Views.ExtendedI.class)
    public String getGameIcon() {
        return this.getGame().getProperties().getIconUri();
    }

    /**
     * Retrieve all variableInstances that belongs to this team only (ie. teamScoped)
     *
     * @return all team's teamScoped instances
     */
    @Override
    public List<VariableInstance> getPrivateInstances() {
        return privateInstances;
    }

    @Override
    public List<VariableInstance> getAllInstances() {
        List<VariableInstance> instances = new ArrayList<>();
        instances.addAll(getPrivateInstances());
        for (Player p : getPlayers()) {
            instances.addAll(p.getAllInstances());
        }
        return instances;
    }

    /**
     * Set privateInstances
     *
     * @param privateInstances
     */
    public void setPrivateInstance(List<VariableInstance> privateInstances) {
        this.privateInstances = privateInstances;
    }

    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        Game game = this.getGame();
        if (game != null) {
            return this.getGame().getEntities();
        } else {
            return null;
        }
    }

    @Override
    @JsonIgnore
    public String getChannel() {
        return Helper.TEAM_CHANNEL_PREFIX + this.getId();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        /*
         * since a player should be able to join a team by itself
         * restricting update permission is not possible.
         *
         * A player shouldn't be authorized to join a team by itself.
         * A player should be able to create a team and a team member should be able 
         * to invite other players in the team. Such behaviour allow to set an updatePermission
         */
        return WegasPermission.getAsCollection(this.getAssociatedReadPermission());
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        switch (this.getGame().getAccess()) {
            case OPEN:
                return null; // everybody can register en new team
            default:
                return WegasPermission.FORBIDDEN; // nobody can create
        }
    }

    @Override
    public WithPermission getMergeableParent() {
        return getGame();
    }

    @Override
    public Collection<WegasPermission> getRequieredDeletePermission() {
        return WegasPermission.getAsCollection(this.getAssociatedWritePermission());
    }

    @Override
    public WegasPermission getAssociatedReadPermission() {
        return new WegasEntityPermission(this.getId(), WegasEntityPermission.Level.READ, WegasEntityPermission.EntityType.TEAM);
    }

    @Override
    public WegasPermission getAssociatedWritePermission() {
        return new WegasEntityPermission(this.getId(), WegasEntityPermission.Level.WRITE, WegasEntityPermission.EntityType.TEAM);
    }
}
