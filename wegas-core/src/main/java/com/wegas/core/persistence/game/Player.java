/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.security.persistence.User;
import java.util.Date;
import java.util.Objects;
import javax.persistence.*;
//////import javax.xml.bind.annotation.XmlTransient;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.wegas.core.persistence.BroadcastTarget;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@NamedQueries({
    @NamedQuery(name = "DEPRECATED_Player.findPlayerByGameId", query = "SELECT player FROM Player player WHERE player.team.game.id = :gameId"),
    @NamedQuery(name = "DEPRECATED_Player.findPlayerByGameIdAndUserId", query = "SELECT player FROM Player player WHERE player.user.id = :userId AND player.team.game.id = :gameId"),
    @NamedQuery(name = "DEPRECATED_Player.findPlayerByTeamIdAndUserId", query = "SELECT player FROM Player player WHERE player.user.id = :userId AND player.team.id = :teamId")
})
@JsonIgnoreProperties(ignoreUnknown = true)
@Table(indexes = {
    @Index(columnList = "user_id"),
    @Index(columnList = "parentteam_id")
})
public class Player extends AbstractEntity implements Broadcastable, BroadcastTarget {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;

    @JsonIgnore
    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL)
    private List<VariableInstance> privateInstances = new ArrayList<>();

    /**
     *
     * @Column(name = "user_id", nullable = true, insertable = false, updatable
     * = false) private Long userId;
     */
    /**
     *
     */
    private String name;
    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    private Date joinTime = new Date();
    /**
     * The game model this belongs to
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JsonBackReference(value = "player-team")
    @JoinColumn(name = "parentteam_id")
    //@XmlInverseReference(mappedBy = "players")
    private Team team;

    /**
     *
     * @Column(name = "parentteam_id", nullable = false, insertable = false,
     * updatable = false) private Long teamId;
     */
    /**
     *
     */
    public Player() {
    }

    /**
     *
     * @param name
     */
    public Player(String name) {
        this.name = name;
    }

    /**
     *
     * @param user
     * @param team
     */
    public Player(User user, Team team) {
        this.name = user.getName();
        this.user = user;
        //this.userId = user.getId();
        this.team = team;
        //this.teamId = team.getId();
    }

    /**
     *
     */
    @PrePersist
    @PreUpdate
    public void preUpdate() {
        if ((this.getName() == null || this.getName().equals(""))
                && this.getUser() != null) {                                    // User may be null for test players
            this.name = this.getUser().getName();
        }
    }

    @Override
    public void merge(AbstractEntity a) {
        Player p = (Player) a;
        this.setName(p.getName());
    }

    @Override
    public Long getId() {
        return id;
    }

    /**
     * @return the user
     */
    @JsonBackReference(value = "player-user")
    public User getUser() {
        return user;
    }

    /**
     * @param user the user to set
     */
    @JsonBackReference(value = "player-user")
    public void setUser(User user) {
        this.user = user;
    }

    /**
     * @return the team
     */
    @JsonBackReference(value = "player-team")
    public Team getTeam() {
        return team;
    }

    /**
     * @param team the team to set
     */
    @JsonBackReference(value = "player-team")
    public void setTeam(Team team) {
        this.team = team;
    }

    /**
     * @return the teamId
     */
    public Long getTeamId() {
        return (this.team != null ? team.getId() : null);
    }

    /**
     *
     * @param teamId
    public void setTeamId(Long teamId) {
        this.teamId = teamId;
    }
     */

    /**
     * @return the userId
     */
    public Long getUserId() {
        return (this.user != null ? user.getId() : null);
    }

    // *** Sugar *** //
    /**
     *
     * @return gameModel the player is linked to
     */
    @JsonIgnore
    public GameModel getGameModel() {
        return this.getTeam().getGame().getGameModel();
    }

    /**
     *
     * @return id of gameModel the player is linked to
     */
    //@XmlTransient
    @JsonIgnore
    public long getGameModelId() {
        return this.getTeam().getGame().getGameModel().getId();
    }

    /**
     *
     * @return game the player is linked to
     */
    @JsonIgnore
    public Game getGame() {
        return this.getTeam().getGame();
    }

    /**
     *
     * @return id of the game the player is linked to
     */
    //@XmlTransient
    @JsonIgnore
    public long getGameId() {
        return this.getTeam().getGame().getId();
    }

    /**
     * @return the name
     */
    public String getName() {
        return name;
    }

    /**
     * @param name the name to set
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return the joinTime
     */
    public Date getJoinTime() {
        return joinTime != null ? new Date(joinTime.getTime()) : null;
    }

    /**
     * @param joinTime the joinTime to set
     */
    public void setJoinTime(Date joinTime) {
        this.joinTime = joinTime != null ? new Date(joinTime.getTime()) : null;
    }

    /**
     * Retrieve all variableInstances that belongs to this player only (ie.
     * playerScoped)
     *
     * @return all player playerScoped instances
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

    @Override
    public String toString() {
        return "Player{" + this.getName() + ", " + this.getId() + ")";
    }

    @Override
    public boolean equals(Object player) {
        return super.equals(player) && this.hashCode() == player.hashCode();
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 83 * hash + Objects.hashCode(this.id);
        //hash = 83 * hash + Objects.hashCode(this.user);
        //hash = 83 * hash + Objects.hashCode(this.userId);
        hash = 83 * hash + Objects.hashCode(this.name);
        hash = 83 * hash + Objects.hashCode(this.joinTime);
        //hash = 83 * hash + Objects.hashCode(this.team);
        //hash = 83 * hash + Objects.hashCode(this.teamId);
        return hash;
    }

    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        return this.getTeam().getEntities();
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        if (this.getUser() != null) {
            User theUser = beans.getUserFacade().find(this.getUserId());
            if (theUser != null) {
                theUser.getPlayers().remove(this);
            }
        }
        if (this.getTeam() != null) {
            Team find = beans.getTeamFacade().find(this.getTeamId());
            if (find != null) {
                find.getPlayers().remove(this);
            }
        }
    }

    @JsonIgnore
    @Override
    public String getChannel() {
        return "Player-" + this.getId();
    }
}
