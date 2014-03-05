/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.jparealm.GameAccount;
import com.wegas.core.security.persistence.User;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlID;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonManagedReference;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(uniqueConstraints = { //    @UniqueConstraint(columnNames = {"name"}), //@UniqueConstraint(columnNames = {"token"}),
//    @UniqueConstraint(columnNames = {"wkey"})
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class Game extends NamedEntity {

    /**
     *
     */
    @Id
    @XmlID
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
    @Basic(fetch = FetchType.LAZY)
    @Lob
    @JsonView(Views.ExtendedI.class)
    private String description;
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
    @XmlTransient
    @JsonIgnore
    private User createdBy;
    
    @OneToMany(mappedBy = "game", cascade = CascadeType.REMOVE, orphanRemoval = true)
    @XmlTransient
    @JsonIgnore
    private Set<GameAccount> gameAccounts;
    /**
     *
     */
    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference("game-team")
    @OrderBy("createdTime")
    private List<Team> teams = new ArrayList<>();
    /**
     *
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "gamemodelid", nullable = false)
    // @JsonBackReference
    private GameModel gameModel;
    /**
     *
     */
    @Column(name = "gamemodelid", nullable = false, insertable = false, updatable = false)
    private Long gameModelId;

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
        URL,
        /**
         *
         */
        ENROLMENTKEY,
        /**
         *
         */
        SINGLEUSAGEENROLMENTKEY,
        /**
         *
         */
        CLOSE
    }
    /**
     *
     */
    @Enumerated
    private GameAccess access = GameAccess.ENROLMENTKEY;
    /**
     *
     */
    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("key")
    @JsonView(Views.EditorExtendedI.class)
    private List<GameEnrolmentKey> keys = new ArrayList<>();
    /**
     *
     */
    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("key")
    @JsonView(Views.EditorExtendedI.class)
    private List<GameAccountKey> accountkeys = new ArrayList<>();

    /**
     *
     */
    public Game() {
    }

    /**
     *
     * @param name
     */
    public Game(String name) {
        this.name = name;
    }

    /**
     *
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
        this.setDescription(other.getDescription());
        super.merge(a);
        this.setAccess(other.getAccess());
        this.setToken(other.getToken());
        //this.setKey(other.getKey());
        ListUtils.mergeLists(this.getKeys(), other.getKeys());
        for (int i = 0; i < other.getAccountkeys().size(); i++) {               // @hack Not possible to use mergeLists.
            boolean founded = false;                                            // Check must be on accountKey and not accountId.
            for (int ii = 0; ii < this.getAccountkeys().size(); ii++) {
                if (this.accountkeys.get(ii).getKey().equals(other.getAccountkeys().get(i).getKey())) {
                    founded = true;
                    break;
                }
            }
            if (!founded) {
                this.accountkeys.add(other.accountkeys.get(i));
            }
        }
//        ListUtils.mergeLists(this.getAccountkeys(), other.getAccountkeys());
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
     *
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
     * @param teams the teams to set
     */
    @JsonManagedReference("game-team")
    public void setTeams(List<Team> teams) {
        this.teams = teams;
    }

    /**
     *
     * @param t
     */
    @XmlTransient
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
     *
     * @return
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     *
     * @return
     */
    @Override
    public String getName() {
        return name;
    }

    /**
     *
     * @param name
     */
    @Override
    public void setName(String name) {
        this.name = name;
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
     *
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
     * @return the keys
     */
    public List<GameEnrolmentKey> getKeys() {
        return keys;
    }

    /**
     * @param keys the keys to set
     */
    public void setKeys(List<GameEnrolmentKey> keys) {
        this.keys = keys;
        for (GameEnrolmentKey k : this.keys) {
            k.setGame(this);
        }
    }

    /**
     *
     * @return
     */
    public List<GameAccountKey> getAccountkeys() {
        return accountkeys;
    }

    /**
     *
     * @param accountkeys
     */
    public void setAccountkeys(List<GameAccountKey> accountkeys) {
        this.accountkeys = accountkeys;
        for (GameAccountKey k : this.accountkeys) {
            k.setGame(this);
        }
    }

    /**
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     *
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
     *
     * @return
     */
    public Map<String, String> getProperties() {
        return this.getGameModel().getProperties();
    }

    /**
     *
     */
    public void setProperties() {
    }
}
