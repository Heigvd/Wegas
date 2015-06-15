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

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@NamedQueries({
    @NamedQuery(name = "findPlayerByGameId", query = "SELECT player FROM Player player WHERE player.team.game.id = :gameId"),
    @NamedQuery(name = "findPlayerByGameIdAndUserId", query = "SELECT player FROM Player player WHERE player.user.id = :userId AND player.team.game.id = :gameId")
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class Player extends AbstractEntity {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @ManyToOne(fetch = FetchType.LAZY)
    private User user;
    /**
     *
     */
    @Column(name = "user_id", nullable = true, insertable = false, updatable = false)
    private Long userId;
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
     */
    @Column(name = "parentteam_id", nullable = false, insertable = false, updatable = false)
    private Long teamId;

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
        this.userId =  user.getId();
        this.team = team;
        this.teamId = team.getId();
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

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Player p = (Player) a;
        this.setName(p.getName());
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
        return teamId;
    }

    /**
     * @return the userId
     */
    public Long getUserId() {
        return userId;
    }

    // *** Sugar *** //
    /**
     *
     * @return
     */
    //@XmlTransient
    @JsonIgnore
    public GameModel getGameModel() {
        return this.getTeam().getGame().getGameModel();
    }

    /**
     *
     * @return
     */
    //@XmlTransient
    @JsonIgnore
    public int getGameModelId() {
        return this.getTeam().getGame().getGameModel().getId().intValue();
    }

    /**
     *
     * @return
     */
    //@XmlTransient
    @JsonIgnore
    public Game getGame() {
        return this.getTeam().getGame();
    }

    /**
     *
     * @return
     */
    //@XmlTransient
    @JsonIgnore
    public int getGameId() {
        return this.getTeam().getGame().getId().intValue();
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
        return joinTime;
    }

    /**
     * @param joinTime the joinTime to set
     */
    public void setJoinTime(Date joinTime) {
        this.joinTime = joinTime;
    }

    @Override
    public String toString() {
        return "Player{" + this.getName() + ", " + this.getId() + ")";
    }

    /**
     *
     * @param player
     * @return
     */
    @Override
    public boolean equals(Object player) {
        return super.equals(player) && this.hashCode() == player.hashCode();
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 83 * hash + Objects.hashCode(this.id);
        hash = 83 * hash + Objects.hashCode(this.user);
        hash = 83 * hash + Objects.hashCode(this.userId);
        hash = 83 * hash + Objects.hashCode(this.name);
        hash = 83 * hash + Objects.hashCode(this.joinTime);
        hash = 83 * hash + Objects.hashCode(this.team);
        hash = 83 * hash + Objects.hashCode(this.teamId);
        return hash;
    }
}
