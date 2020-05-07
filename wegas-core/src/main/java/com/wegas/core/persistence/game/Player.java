/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.ADVANCED;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.google.common.base.Objects;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.aai.AaiAccount;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.WegasEntityPermission;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.Zero;
import com.wegas.editor.view.NumberView;
import com.wegas.editor.view.StringView;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
import javax.persistence.ManyToOne;
import javax.persistence.NamedNativeQuery;
import javax.persistence.NamedQuery;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;
import javax.persistence.Version;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@NamedQuery(name = "Player.findPlayerByGameModelIdAndUserId",
    query = "SELECT p FROM Player p WHERE p.user.id = :userId AND p.team.gameTeams.game.gameModel.id = :gameModelId")
@NamedQuery(name = "Player.findPlayerByGameIdAndUserId",
    query = "SELECT p FROM Player p WHERE p.user.id = :userId AND p.team.gameTeams.game.id = :gameId")
@NamedQuery(name = "Player.findPlayerByTeamIdAndUserId",
    query = "SELECT p FROM Player p WHERE p.user.id = :userId AND p.team.id = :teamId")
@NamedQuery(name = "Player.findToPopulate",
    query = "SELECT a FROM Player a WHERE a.status LIKE 'WAITING' OR a.status LIKE 'RESCHEDULED'")
@NamedNativeQuery(name = "Player.isUserTeamMateOfPlayer",
    query = "SELECT true FROM player as self JOIN player AS mate on mate.team_id = self.team_id WHERE self.id =?1 AND mate.user_id = ?2")
@NamedQuery(name = "Player.findGameIds",
    query = "SELECT p.team.gameTeams.game.id FROM Player p where p.user.id = :userId")
@NamedNativeQuery(name = "Player.IsTrainerForUser",
    query = "SELECT true FROM player as player "
    + " JOIN team AS team on team.id = player.team_id"
    + " JOIN gameteams AS gt on gt.id = team.gameteams_id"
    + " JOIN permission perm on perm.permissions LIKE 'Game:%Edit%:g' || gt.game_id"
    + " WHERE player.user_id = ?1 AND perm.user_id = ?2")
@JsonIgnoreProperties(ignoreUnknown = true)
@Table(indexes = {
    @Index(columnList = "user_id"),
    @Index(columnList = "team_id")
})
public class Player extends AbstractEntity implements Broadcastable, InstanceOwner, DatedEntity, Populatable {

    private static final Logger logger = LoggerFactory.getLogger(Player.class);

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
     * RefName of player preferred language
     */
    @Column(length = 16, columnDefinition = "character varying(16) default ''::character varying")
    @WegasEntityProperty(nullable = false, optional = false,
        view = @View(label = "Language", readOnly = true, value = StringView.class))
    private String lang;

    @JsonIgnore
    @OneToMany(mappedBy = "player", cascade = CascadeType.ALL)
    private List<VariableInstance> privateInstances = new ArrayList<>();

    @Transient
    private Integer queueSize = 0;

    /**
     *
     * @Column(name = "user_id", nullable = true, insertable = false, updatable = false) private
     * Long userId;
     */
    /**
     *
     * @WegasEntityProperty(optional = false, nullable = false, view = @View(label = "Name",
     * readOnly = true, value = StringView.class)) private String name;
     */
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
    @JoinColumn(nullable = false)
    private Team team;

    /**
     *
     */
    @Enumerated(value = EnumType.STRING)
    @Column(length = 24, columnDefinition = "character varying(24) default 'WAITING'::character varying")
    private Status status = Status.WAITING;

    @Version
    @WegasEntityProperty(nullable = false, optional = false, proposal = Zero.class,
        sameEntityOnly = true, view = @View(
            label = "Version",
            readOnly = true,
            value = NumberView.class,
            featureLevel = ADVANCED
        )
    )
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
     * @Column(name = "parentteam_id", nullable = false, insertable = false, updatable = false)
     * private Long teamId;
     */
    /**
     *
     */
    public Player() {
        // ensure to have an empty constructor
    }

    /**
     *
     * @param user
     * @param team
     */
    public Player(User user, Team team) {
        //this.name = user.getName();
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
     * @PrePersist @PreUpdate public void preUpdate() { if ((this.getName() == null ||
     * this.getName().equals("")) && this.getUser() != null) { // User may be null for test players
     * this.name = this.getUser().getName(); } }
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

    public String getLang() {
        return lang != null ? lang.toUpperCase() : null;
    }

    public void setLang(String langCode) {
        this.lang = langCode != null ? langCode.toUpperCase() : null;
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
     * @param teamId public void setTeamId(Long teamId) { this.teamId = teamId; }
     */
    /**
     * @return the userId
     */
    public Long getUserId() {
        return (this.user != null ? user.getId() : null);
    }

    // ~~~ Sugar ~~~
    /**
     *
     * @return gameModel the player is linked to
     */
    @JsonIgnore
    @Override
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
    public Long getGameId() {
        if (this.getTeam() != null && this.getGame() != null) {
            return this.getTeam().getGame().getId();
        }
        return null;
    }

    /**
     * @return the name
     */
    @JsonView({
        Views.EditorI.class
    /*Views.LobbyI.class*/
    })
    @WegasExtraProperty
    public String getName() {
        if (this.getUser() != null) {
            AbstractAccount account = this.getUser().getMainAccount();
            return account.getName();
        } else {
            return "Test player";
        }
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

    @Override
    public void setStatus(Status status) {
        this.status = status;
    }

    /*
     * @return true if the user's main account is verified
     */
    @JsonProperty
    @JsonView(Views.EditorI.class)
    public Boolean isVerifiedId() {
        if (this.user != null) {
            return user.getMainAccount().isVerified();
        } else {
            return false;
        }
    }

    /*
    * @return the user's verified homeOrg if it's an AaiAccount or equivalent, otherwise return the empty string
     */
    @JsonView(Views.EditorI.class)
    public String getHomeOrg() {
        if (this.user != null) {
            AbstractAccount account = user.getMainAccount();
            if (account != null) {
                if (account instanceof AaiAccount) {
                    return "AAI " + ((AaiAccount) account).getHomeOrg();
                } else if (account.isVerified()) {
                    return account.getEmailDomain();
                }
            }
        }
        return "";
    }

    /**
     * Retrieve all variableInstances that belongs to this player only (ie. playerScoped)
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

    @Override
    @JsonIgnore
    public Player getAnyLivePlayer() {
        if (this.getStatus().equals(Status.LIVE)) {
            return this;
        } else {
            return null;
        }
    }

    /**
     * {@inheritDoc }
     */
    @Override
    @JsonIgnore
    public Player getUserLivePlayer(User user) {
        if (this.getStatus().equals(Status.LIVE)
            && Objects.equal(this.user, user)) {
            return this;
        } else {
            return null;
        }
    }

    @Override
    public Player getTestPlayer() {
        if (this.isTestPlayer()) {
            return this;
        } else {
            return null;
        }
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
        String audience = this.getTeam().getChannel();

        Map<String, List<AbstractEntity>> map = new HashMap<>();
        ArrayList<AbstractEntity> entities = new ArrayList<>();
        entities.add(this);
        map.put(audience, entities);
        return map;
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        if (this.getUser() != null) {
            UserFacade userFacade = beans.getUserFacade();
            User theUser = userFacade.find(this.getUserId());
            if (theUser != null) {
                if (this.getGameId() != null) {
                    userFacade.deletePermissions(theUser, "Game:View:g" + this.getGameId());
                } else {
                    logger.error("ORHAN PERMISSION");
                }
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

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        // ?? strange, should be either this.getChannel() to have a very incognito mode
        // but, with broadcastScope, should be GameModel.Read, nope ? TBT
        return this.getTeam().getRequieredReadPermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return WegasPermission.getAsCollection(this.getAssociatedWritePermission());
    }

    /*@Override
    public Collection<WegasPermission> getRequieredDeletePermission() {
        // One must have the right to delete its own team from the game
        return this.getGame().getGameTeams().getRequieredUpdatePermission();
    }*/
    @Override
    public WegasPermission getAssociatedReadPermission() {
        return new WegasEntityPermission(this.getId(), WegasEntityPermission.Level.READ, WegasEntityPermission.EntityType.PLAYER);
    }

    @Override
    public WegasPermission getAssociatedWritePermission() {
        return new WegasEntityPermission(this.getId(), WegasEntityPermission.Level.WRITE, WegasEntityPermission.EntityType.PLAYER);
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getTeam();
    }

    public boolean isTestPlayer() {
        return this.getTeam() instanceof DebugTeam || this.getGame() instanceof DebugGame;
    }

    /**
     * Assert the given player has a valid email address, according to the list of allowed
     * domains.If the domain list is empty then everything is allowed.If not empty, the player must
     * have an address in this domain.Moreover, if mustBeVerigied is true, the address must have
     * been verified
     * <p>
     * An administrator is always allowed, as well as test players.
     *
     * @param allowedDomains     list of allowed domain
     * @param mustBeVerified     ensure the player has verified his address
     * @param notAllowedMessage  to override default error message, may be null
     * @param notVerifiedMessage to override default error message, may be null
     */
    public void assertEmailValdity(List<String> allowedDomains,
        boolean mustBeVerified, String notAllowedMessage, String notVerifiedMessage) {

        if (allowedDomains != null && !allowedDomains.isEmpty()) {
            User user = this.getUser();

            // test player is not linked to any user
            if (user != null) {
                List<String> domains = new ArrayList<>(allowedDomains.size());
                for (String domain : allowedDomains) {
                    String trim = domain.toLowerCase().trim();
                    if (!Helper.isNullOrEmpty(trim)) {
                        domains.add(trim);
                    }
                }
                if (!domains.isEmpty()) {

                    AbstractAccount account = user.getMainAccount();
                    if (Helper.isNullOrEmpty(account.getEmail())) {
                        throw WegasErrorMessage.error("You have to provide an email address!");
                    } else {
                        String domain = account.getEmail().split("@")[1].toLowerCase();
                        if (!domains.contains(domain)) {
                            throw WegasErrorMessage.error(
                                Helper.coalesce(notAllowedMessage,
                                    "Email addresses \"@" + domain + "\" are not allowed")
                            );
                        }
                    }
                    if (mustBeVerified && !account.isVerified()) {
                        throw WegasErrorMessage.error(
                            Helper.coalesce(notVerifiedMessage,
                                "You have to verify your email address"));
                    }
                }
            }
        }
    }
}
