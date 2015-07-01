/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.jparealm.GameAccount;
import com.wegas.core.security.persistence.User;

import javax.persistence.*;
import javax.validation.constraints.NotNull;
import java.util.*;

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
@Entity
@Table(uniqueConstraints = {
    //    @UniqueConstraint(columnNames = {"name"}), 
    @UniqueConstraint(columnNames = {"token"})
})
@NamedQueries({
    @NamedQuery(name = "game.findByStatus", query = "SELECT DISTINCT g FROM Game g WHERE TYPE(g) != DebugGame AND g.status = :status ORDER BY g.createdTime ASC"),
    @NamedQuery(name = "game.findByToken", query = "SELECT DISTINCT g FROM Game g WHERE  g.status = :status AND g.token = :token")
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class Game extends NamedEntity {

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    @Id
    @Column(name = "game_id")
    @GeneratedValue
    private Long id;

    /**
     *
     */
    @Basic(optional = false)
    //@Pattern(regexp = "^\\w+$")
    private String name;

    /**
     *
     */
    @NotNull
    @Basic(optional = false)
    // @Pattern(regexp = "^\\w+$")
    private String token;

    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    private Date createdTime = new Date();

    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    private Date updatedTime = new Date();

    /**
     *
     */
    @ManyToOne(fetch = FetchType.LAZY)
    //@XmlTransient
    @JsonIgnore
    private User createdBy;

    /**
     *
     */
    @OneToMany(mappedBy = "game", cascade = CascadeType.REMOVE, orphanRemoval = true)
    //@XmlTransient
    @JsonIgnore
    private Set<GameAccount> gameAccounts;

    /**
     *
     */
    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("game-team")
    @OrderBy("createdTime")
    private List<Team> teams = new ArrayList<>();

    @JsonIgnore
    @OneToMany(mappedBy = "game", cascade = CascadeType.REMOVE)
    private List<VariableInstance> privateInstances;

    /**
     *
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "gamemodelid", nullable = false)
    private GameModel gameModel;

    /**
     *
     */
    @Column(name = "gamemodelid", nullable = false, insertable = false, updatable = false)
    private Long gameModelId;

    /**
     *
     */
    @Enumerated
    private GameAccess access = GameAccess.CLOSE;

    /**
     *
     */
    @Enumerated(value = EnumType.STRING)
    @Column(length = 24)
    private Status status = Status.LIVE;

    /**
     *
     */
    public Game() {
    }

    /**
     * @param name
     */
    public Game(String name) {
        this.name = name;
    }

    /**
     * @param name
     * @param token
     */
    public Game(String name, String token) {
        this.name = name;
        this.token = token;
    }

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        this.setCreatedTime(new Date());
        if (this.teams.isEmpty()) {
            this.addTeam(new DebugTeam());
        }
        this.preUpdate();
    }

    /**
     *
     */
    @PreUpdate
    public void preUpdate() {
        this.setUpdatedTime(new Date());
    }

    @Override
    public void merge(AbstractEntity a) {
        Game other = (Game) a;
        super.merge(a);
        this.setAccess(other.getAccess());
        this.setToken(other.getToken());
    }

    /**
     * @return the teams
     */
    @JsonManagedReference("game-team")
    @JsonView(Views.Public.class)
    public List<Team> getTeams() {
        return this.teams;
    }

    /**
     * @param teams the teams to set
     */
    @JsonManagedReference("game-team")
    public void setTeams(List<Team> teams) {
        this.teams = teams;
    }

    @JsonIgnore
    public Status getStatus() {
        return status;
    }

    @JsonIgnore
    public void setStatus(Status status) {
        this.status = status;
    }

    /**
     * @return
     */
    @JsonIgnore
    public List<Player> getPlayers() {
        List<Player> players = new ArrayList<>();
        for (Team t : this.getTeams()) {
            players.addAll(t.getPlayers());
        }
        return players;
    }

    /**
     * @param t
     */
    //@XmlTransient
    @JsonIgnore
    public void addTeam(Team t) {
        this.teams.add(t);
        t.setGame(this);
    }

    /**
     * @return the gameModel
     */
    @JsonView(Views.ExtendedI.class)
    public GameModel getGameModel() {
        return gameModel;
    }

    /**
     * @param gameModel the gameModel to set
     */
    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    /**
     * @return
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     * @return
     */
    @Override
    public String getName() {
        return name;
    }

    /**
     * @param name
     */
    @Override
    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return
     */
    @JsonIgnore
    public String getShortName() {
        if (this.name.length() > 11) {
            return this.name.substring(0, 11);
        } else {
            return this.name;
        }
    }

    /**
     * @return the token
     */
    public String getToken() {
        return token;
    }

    /**
     * @param token the token to set
     */
    public void setToken(String token) {
        this.token = token;
    }

    /**
     * @return the createdTime
     */
    public Date getCreatedTime() {
        return createdTime;
    }

    /**
     * @param createdTime the createdTime to set
     */
    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime;
    }

    /**
     * @return the updatedTime
     */
    public Date getUpdatedTime() {
        return updatedTime;
    }

    /**
     * @param updatedTime the updatedTime to set
     */
    public void setUpdatedTime(Date updatedTime) {
        this.updatedTime = updatedTime;
    }

    /**
     * @return the creator
     */
    @JsonIgnore
    public User getCreatedBy() {
        return createdBy;
    }

    /**
     * @param createdBy
     */
    public void setCreatedBy(User createdBy) {
        this.createdBy = createdBy;
    }

    /**
     * @return
     */
    public String getCreatedByName() {
        if (this.getCreatedBy() != null) {
            return this.getCreatedBy().getName();
        }
        return null;
    }

    /**
     * @return the gameModelId
     */
    public Long getGameModelId() {
        return gameModelId;
    }

    /**
     * @param gameModelId the gameModelId to set
     */
    public void setGameModelId(Long gameModelId) {
        this.gameModelId = gameModelId;
    }

    /**
     * @return the access
     */
    public GameAccess getAccess() {
        return access;
    }

    /**
     * @param access the access to set
     */
    public void setAccess(GameAccess access) {
        this.access = access;
    }

    /**
     * @return
     */
    public String getGameModelName() {
        return this.getGameModel().getName();
    }

    /**
     *
     */
    public void setGameModelName() {
    }

    /**
     * @return
     */
    public GameModelProperties getProperties() {
        return this.getGameModel().getProperties();
    }

    /**
     * @param p
     */
    public void setProperties(GameModelProperties p) {
        // So jersey don't yell
    }

    /**
     * Retrieve all variableInstances that belongs to this game only (ie.
     * gameScoped)
     *
     * @return all game gameScoped instances
     */
    public List<VariableInstance> getPrivateInstances() {
        return privateInstances;
    }

    /**
     *
     * @param privateInstances
     */
    public void setPrivateInstances(List<VariableInstance> privateInstances) {
        this.privateInstances = privateInstances;
    }

    /**
     *
     */
    public enum GameAccess {

        /**
         *
         */
        OPEN,
        /**
         *
         */
        CLOSE
    }

    /**
     *
     */
    public enum Status {

        /**
         * Initial value, game is playable
         */
        LIVE,
        /**
         * Game in the wast bin
         */
        BIN,
        /**
         * Schedule for deletion
         */
        DELETE,
        /**
         * Does not exist anymore. Actually, this status should never persist.
         * Used internally as game's missing.
         */
        SUPPRESSED
    }
}
