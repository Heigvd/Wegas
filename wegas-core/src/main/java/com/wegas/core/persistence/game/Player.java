/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.security.aai.AaiAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import java.util.Date;
import java.util.Objects;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.wegas.core.Helper;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.merge.annotations.WegasEntityProperty;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@NamedQueries({
    @NamedQuery(name = "DEPRECATED_Player.findPlayerByGameId", query = "SELECT player FROM Player player WHERE player.team.game.id = :gameId"),
    @NamedQuery(name = "DEPRECATED_Player.findPlayerByGameIdAndUserId", query = "SELECT player FROM Player player WHERE player.user.id = :userId AND player.team.game.id = :gameId"),
    @NamedQuery(name = "DEPRECATED_Player.findPlayerByTeamIdAndUserId", query = "SELECT player FROM Player player WHERE player.user.id = :userId AND player.team.id = :teamId"),
    @NamedQuery(name = "Player.findToPopulate", query = "SELECT a FROM Player a WHERE a.status LIKE 'WAITING' OR a.status LIKE 'RESCHEDULED'")
})
@JsonIgnoreProperties(ignoreUnknown = true)
@Table(indexes = {
    @Index(columnList = "user_id"),
    @Index(columnList = "parentteam_id")
})
public class Player extends AbstractEntity implements Broadcastable, InstanceOwner, DatedEntity, Populatable {

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

    @Transient
    private Integer queueSize = 0;

    /**
     *
     * @Column(name = "user_id", nullable = true, insertable = false, updatable
     * = false) private Long userId;
     */
    /**
     *
     */
    @WegasEntityProperty
    private String name;
    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date joinTime = new Date();
    /**
     * The game model this belongs to
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JsonBackReference(value = "player-team")
    @JoinColumn(name = "parentteam_id", nullable = false)
    private Team team;

    @Transient
    private Boolean verifiedId = null;

    @Transient
    private String homeOrg = null;

    /**
     *
     */
    @Enumerated(value = EnumType.STRING)
    
    @Column(length = 24, columnDefinition = "character varying(24) default 'WAITING'::character varying")
    private Status status = Status.WAITING;

    @Version
    @Column(columnDefinition = "bigint default '0'::bigint")
    private Long version;

    public Long getVersion() {
        return version;
    }

    public void setVersion(Long version) {
        this.version = version;
    }

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

    public Integer getQueueSize() {
        return queueSize;
    }

    public void setQueueSize(Integer queueSize) {
        this.queueSize = queueSize;
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
    public void __merge(AbstractEntity a) {
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

    @Override
    public Date getCreatedTime() {
        return this.getJoinTime();
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

    @Override
    public Status getStatus() {
        return status;
    }

    public void setStatus(int i) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    public void setStatus(Status status) {
        this.status = status;
    }

    /*
     * @return true if the user's main account is an AaiAccount or equivalent
     */
    public boolean isVerifiedId() {
        if (verifiedId != null) {
            return verifiedId;
        } else {
            if (this.user != null) {
                boolean verif = user.getMainAccount() instanceof AaiAccount;
                verifiedId = verif;
                return verif;
            } else {
                return false;
            }
        }
    }


    /*
    * @return the user's verified homeOrg if it's an AaiAccount or equivalent, otherwise return the empty string
     */
    public String getHomeOrg() {
        if (homeOrg != null) {
            return homeOrg;
        } else {
            if (this.user != null) {
                AbstractAccount acct = user.getMainAccount();
                if (acct instanceof AaiAccount) {
                    homeOrg = ((AaiAccount) acct).getHomeOrg();
                } else {
                    homeOrg = "";
                }
                return homeOrg;
            } else {
                return "";
            }
        }
    }

    /**
     * Retrieve all variableInstances that belongs to this player only (ie.
     * playerScoped)
     *
     * @return all player playerScoped instances
     */
    @Override
    public List<VariableInstance> getPrivateInstances() {
        return privateInstances;
    }

    @Override
    public List<VariableInstance> getAllInstances() {
        return getPrivateInstances();
    }

    @Override
    @JsonIgnore
    public List<Player> getPlayers() {
        ArrayList<Player> pl = new ArrayList<>();
        pl.add(this);
        return pl;
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
        return Helper.PLAYER_CHANNEL_PREFIX + this.getId();
    }
}
