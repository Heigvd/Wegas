/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.fasterxml.jackson.annotation.*;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.BroadcastTarget;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
////import javax.xml.bind.annotation.XmlTransient;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"name", "parentgame_id"}),
        indexes = {
            @Index(columnList = "parentgame_id")
        }
)
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "DebugTeam", value = DebugTeam.class)
})
@NamedQueries({
    @NamedQuery(name = "Team.findByGameIdAndName", query = "SELECT a FROM Team a WHERE a.name = :name AND a.game.id = :gameId")})
public class Team extends AbstractEntity implements Broadcastable, BroadcastTarget {

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
    private String name;

    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdTime = new Date();

    /**
     *
     */
    @Lob
    @JsonView(value = Views.EditorI.class)
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
     * The game model this belongs to
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "parentgame_id")
    //@XmlTransient
    @JsonIgnore
    //@XmlInverseReference(mappedBy = "teams")
    @JsonBackReference(value = "game-team")
    private Game game;

    /**
     *
     */
    @Column(name = "parentgame_id", nullable = false, insertable = false, updatable = false)
    private Long gameId;

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
        this.setDeclaredSize(declaredSize);
    }

    /**
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Team t = (Team) a;
        this.setName(t.getName());
        this.setNotes(t.getNotes());
    }

    /**
     * @return the gameModel
     */
    @JsonBackReference(value = "game-team")
    public Game getGame() {
        return game;
    }

    /**
     * @param game the gameModel to set
     */
    @JsonBackReference(value = "game-team")
    public void setGame(Game game) {
        this.game = game;
    }

    /**
     * @return the players
     */
    @JsonManagedReference(value = "player-team")
    public List<Player> getPlayers() {
        return players;
    }

    /**
     * @param p
     */
    //@XmlTransient
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
        return (game != null ? game.getId() : null);
    }

    /**
     *
     * @param gameId public void setGameId(Long gameId) { this.gameId = gameId;
     *               }
     */
    /**
     * @return the createdTime
     */
    public Date getCreatedTime() {
        return createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    /**
     * @param createdTime the createdTime to set
     */
    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime != null ? new Date(createdTime.getTime()) : null;
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
    @JsonView(value = Views.Extended.class)
    public String getGameName() {
        return this.getGame().getName();
    }

    /**
     * @return boolean, free if the game is played individualy, false if the
     *         game is played in team
     */
    @JsonView(value = Views.Extended.class)
    public boolean getGameFreeForAll() {
        return this.getGame().getProperties().getFreeForAll();
    }

    /**
     * @return String, the representation for the icon of the game
     */
    @JsonView(value = Views.Extended.class)
    public String getGameIcon() {
        return this.getGame().getProperties().getIconUri();
    }

    /**
     * Retrieve all variableInstances that belongs to this team only (ie.
     * teamScoped)
     *
     * @return all team's teamScoped instances
     */
    public List<VariableInstance> getPrivateInstances() {
        return privateInstances;
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
        return this.getGame().getEntities();
    }

    @Override
    @JsonIgnore
    public String getChannel() {
        return "Team-" + this.getId();
    }
}
