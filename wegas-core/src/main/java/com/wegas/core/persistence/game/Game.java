/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.AcceptInjection;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.InstanceOwner;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.persistence.token.InviteToJoinToken;
import com.wegas.core.security.util.WegasEntityPermission;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.ValueGenerators.Open;
import com.wegas.editor.view.Hidden;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import jakarta.persistence.Basic;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.NamedQuery;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import jakarta.persistence.Transient;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@Table(
    //uniqueConstraints = {
    //    @UniqueConstraint(columnNames = {"name"}),
    //    @UniqueConstraint(columnNames = {"token"})}, // partial index : WHERE status = LIVE OR status = BIN
    indexes = {
        @Index(columnList = "gamemodel_id"),
        @Index(columnList = "createdby_id")
    }
)
@NamedQuery(
    name = "Game.findByStatus",
    query = "SELECT DISTINCT g FROM Game g WHERE TYPE(g) != DebugGame AND g.status = :status ORDER BY g.createdTime ASC"
)
@NamedQuery(
    name = "Game.findByStatuses",
    query = "SELECT DISTINCT g FROM Game g WHERE TYPE(g) != DebugGame AND g.status IN :statuses ORDER BY g.createdTime ASC"
)
@NamedQuery(
    name = "Game.findIdById",
    query = "SELECT DISTINCT g.id FROM Game g WHERE g.id = :gameId"
)
@NamedQuery(
    name = "Game.findByToken",
    query = "SELECT DISTINCT g FROM Game g WHERE  g.status = :status AND g.token = :token"
)
@NamedQuery(
    name = "Game.findByNameLike",
    query = "SELECT DISTINCT g FROM Game g WHERE  g.name LIKE :name"
)
@NamedQuery(
    name = "Game.findAllIdByLogId",
    query = "SELECT g.id FROM Game g WHERE g.gameModel.type = com.wegas.core.persistence.game.GameModel.GmType.PLAY AND g.gameModel.properties.logID = :logId"
)
@JsonIgnoreProperties(ignoreUnknown = true)
public class Game extends AbstractEntity implements Broadcastable, InstanceOwner, DatedEntity, NamedEntity, AcceptInjection {

    private static final long serialVersionUID = 1L;

    @JsonIgnore
    @Transient
    protected Beanjection beans;

    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;

    /**
     *
     */
    @Basic(optional = false)
    @Pattern(regexp = "^.*\\S+.*$", message = "Game name cannot be empty")// must at least contains one non-whitespace character
    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(label = "Name"))
    private String name;

    /**
     *
     */
    @NotNull
    @Basic(optional = false)
    @Pattern(regexp = "^([a-zA-Z0-9_-]|\\.(?!\\.))*$", message = "Token shall only contains alphanumeric characters, numbers, dots, underscores or hyphens")
    @WegasEntityProperty(
        nullable = false, optional = false,
        view = @View(label = "Token"))
    private String token;

    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date createdTime = new Date();

    /**
     *
     */
    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date updatedTime = new Date();

    /**
     *
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    private User createdBy;

    /**
     *
     */
    @OneToOne(mappedBy = "game", cascade = CascadeType.ALL)
    @JsonIgnore
    private GameTeams gameTeams;

    /**
     *
     */
    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(nullable = false)
    private GameModel gameModel;

    /**
     *
     */
    @Enumerated
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = Open.class,
        view = @View(label = "Access"))
    private GameAccess access = GameAccess.OPEN;

    /**
     * If set to true, player will not be able to create teams on their own.
     * They may only join an existing one.
     * The trainer is still able to create teams
     */
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.False.class,
        view = @View(label = "Players may create teams"))
    private Boolean preventPlayerCreatingTeams = false;


    /**
     * If set to true, player will not be able to leave team once joined.
     * The trainer is still able to kick players
     */
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.False.class,
        view = @View(label = "Players may leave teams"))
    private Boolean preventPlayerLeavingTeam = false;

    /**
     *
     */
    @Enumerated(value = EnumType.STRING)
    @Column(length = 24, columnDefinition = "character varying(24) default 'LIVE'::character varying")
    private Status status = Status.LIVE;

    /**
     *
     */
    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<InviteToJoinToken> invitations = new ArrayList<>();

    /**
     *
     */
    @OneToMany(mappedBy = "game", cascade = CascadeType.ALL)
    @JsonIgnore
    private List<InviteToJoinToken> surveyInvitation = new ArrayList<>();

    /**
     *
     */
    public Game() {
        // ensure there is a default constructor
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
        if (gameTeams == null) {
            this.setGameTeams(new GameTeams());
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

    public GameTeams getGameTeams() {
        if (gameTeams == null) {
            this.setGameTeams(new GameTeams());
        }
        return gameTeams;
    }

    public void setGameTeams(GameTeams gameTeams) {
        this.gameTeams = gameTeams;
        this.gameTeams.setGame(this);
    }

    /**
     * @return the teams
     */
    @JsonManagedReference("game-team")
    // Exclude this property from the Lobby view and force a fetch in Editor view:
    @JsonView(Views.ExtendedI.class)
    @WegasExtraProperty(optional = false, nullable = false, view = @View(label = "Teams", value = Hidden.class))
    public List<Team> getTeams() {
        return this.getGameTeams().getTeams();
    }

    /**
     * @param teams the teams to set
     */
    @JsonManagedReference("game-team")
    public void setTeams(List<Team> teams) {
        this.getGameTeams().setTeams(teams);
    }

    @WegasExtraProperty(
        optional = false, nullable = false,
        view = @View(
            label = "Status",
            value = Hidden.class
        )
    )
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public Status getStatus() {
        return status;
    }

    @JsonIgnore
    public void setStatus(Status status) {
        this.status = status;
    }

    /**
     * @return all players from all teams
     */
    @JsonIgnore
    @Override
    public List<Player> getPlayers() {
        List<Player> players = new ArrayList<>();
        for (Team t : this.getTeams()) {
            players.addAll(t.getPlayers());
        }
        return players;
    }

    /**
     * Return all LIVE teams of the game. To be considered LIVE, a team must have a LIVE status and
     * must contains at least one player with such a LIVE status too
     *
     * @return
     */
    @JsonIgnore
    public List<Team> getLiveTeams() {
        List<Team> lives = new ArrayList<>();

        List<Team> teams = this.getTeams();

        for (Team t : teams) {
            if (t.getStatus() == Populatable.Status.LIVE && !t.getLivePlayers().isEmpty()) {
                lives.add(t);
            }
        }

        return lives;
    }

    /**
     * {@inheritDoc }
     */
    @JsonIgnore
    @Override
    public Player getUserLivePlayer(User user) {
        for (Team t : this.getTeams()) {
            Player theP = t.getUserLivePlayer(user);
            if (theP != null) {
                return theP;
            }
        }
        return null;
    }

    /**
     * {@inheritDoc }
     */
    @JsonIgnore
    @Override
    public Player getUserLiveOrSurveyPlayer(User user) {
        for (Team t : this.getTeams()) {
            Player theP = t.getUserLiveOrSurveyPlayer(user);
            if (theP != null) {
                return theP;
            }
        }
        return null;
    }

    /**
     * {@inheritDoc }
     */
    @JsonIgnore
    @Override
    public Player getAnyLivePlayer() {
        for (Team t : this.getTeams()) {
            Player p = t.getAnyLivePlayer();
            if (p != null) {
                return t.getAnyLivePlayer();
            }
        }
        return null;
    }

    @JsonIgnore
    @Override
    public Player getTestPlayer() {
        if (this instanceof DebugGame) {
            return this.getAnyLivePlayer();
        } else {
            for (Team t : this.getTeams()) {
                Player testPlayer = t.getTestPlayer();
                if (testPlayer != null) {
                    return testPlayer;
                }
            }
        }
        return null;
    }

    /**
     * @param t
     */
    @JsonIgnore
    public void addTeam(Team t) {

        this.getTeams().add(t);
        t.setGame(this);
        //t.setGameId(this.getId());
    }

    /**
     * @return the gameModel
     */
    @JsonView({Views.LobbyI.class, Views.EditorI.class})
    @Override
    public GameModel getGameModel() {
        return gameModel;
    }

    /**
     * @param gameModel the gameModel to set
     */
    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    @Override
    public Long getId() {
        return id;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return short game name (10 first chars)
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
    @Override
    @WegasExtraProperty(nullable = false, optional = false)
    public Date getCreatedTime() {
        return createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    /**
     * @param createdTime the createdTime to set
     */
    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    /**
     * @return the updatedTime
     */
    public Date getUpdatedTime() {
        return updatedTime != null ? new Date(updatedTime.getTime()) : null;
    }

    /**
     * @param updatedTime the updatedTime to set
     */
    public void setUpdatedTime(Date updatedTime) {
        this.updatedTime = updatedTime != null ? new Date(updatedTime.getTime()) : null;
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
     * @return game creator name or null if the user doesn't exists anymore
     */
    @JsonView({Views.EditorI.class, Views.LobbyI.class})
    public String getCreatedByName() {
        if (this.getCreatedBy() != null) {
            return this.getCreatedBy().getName();
        }
        return null;
    }

    /**
     * @return id of the user who created this or null if user no longer exists
     */
    @WegasExtraProperty
    //@JsonView({Views.EditorI.class, Views.LobbyI.class})
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    public Long getCreatedById() {
        if (this.getCreatedBy() != null) {
            return this.getCreatedBy().getId();
        }
        return null;
    }



    /**
     * @return the gameModelId
     */
    public Long getGameModelId() {
        //return gameModelId;
        return (this.gameModel != null ? this.gameModel.getId() : null);
    }

    /**
     * @param gameModelId the gameModelId to set public void setGameModelId(Long gameModelId) {
     *                    this.gameModelId = gameModelId; }
     */
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
     * Do player have the ability to create teams?
     *
     * @return player ability to create teams
     */
    public Boolean getPreventPlayerCreatingTeams() {
        return preventPlayerCreatingTeams;
    }

    /**
     * Give or remove the ability for players to create teams
     *
     * @param preventPlayerCreatingTeams new right
     */
    public void setPreventPlayerCreatingTeams(Boolean preventPlayerCreatingTeams) {
        this.preventPlayerCreatingTeams = preventPlayerCreatingTeams;
    }

    /**
     * Can player leave teams ?
     * @return player ability to leave teams
     */
    public Boolean getPreventPlayerLeavingTeam() {
        return preventPlayerLeavingTeam;
    }

    /**
     * Give or remove the ability for players to leave teams
     *
     * @param preventPlayerLeavingTeam new right
     */
    public void setPreventPlayerLeavingTeam(Boolean preventPlayerLeavingTeam) {
        this.preventPlayerLeavingTeam = preventPlayerLeavingTeam;
    }

    /**
     * @return gameModel name
     */
    public String getGameModelName() {
        return this.getGameModel().getName();
    }

    /**
     * NoOp make jackson happy
     */
    public void setGameModelName() {
        // NoOp
    }

    /**
     * @return get gameModel properties
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

    @Override
    public List<VariableInstance> getPrivateInstances() {
        return new ArrayList<>();
    }

    @Override
    public List<VariableInstance> getAllInstances() {
        List<VariableInstance> instances = new ArrayList<>();
        for (Team t : getTeams()) {
            instances.addAll(t.getAllInstances());
        }
        return instances;
    }

    public List<InviteToJoinToken> getInvitations() {
        return invitations;
    }

    public void setInvitations(List<InviteToJoinToken> invitations) {
        this.invitations = invitations;
    }

    public void removeInvitation(InviteToJoinToken invitation) {
        this.invitations.remove(invitation);
    }

    /**
     * @return true if such a debugteam exists
     */
    public boolean hasDebugTeam() {
        for (Team t : this.getTeams()) {
            if (t instanceof DebugTeam) {
                return true;
            }
        }
        return false;
    }

    @Override
    @JsonIgnore
    public String getChannel() {
        return Helper.GAME_CHANNEL_PREFIX + getId();
    }

    /**
     *
     */
    public enum GameAccess {

        /**
         * Player can join
         */
        OPEN,
        /**
         * Player can not join
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
         * Does not exist anymore. Actually, this status should never persist. Used internally as
         * game's missing.
         */
        SUPPRESSED
    }

    /**
     * {@inheritDoc}
     */
    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        ArrayList<AbstractEntity> entities = new ArrayList<>();
        entities.add(this);

        // Fetch all user who with any access to the game
        Set<User> users = new HashSet<>();

        if (this.gameModel != null) {
            // all scenarists
            users.addAll(beans.getGameModelFacade().findScenarists(gameModel.getId()));
        }

        // all trainers
        users.addAll(beans.getGameFacade().findTrainers(this.getId()));

        // all players
        this.getPlayers().stream().forEach(p -> {
            if (p.getUser() != null) {
                users.add(p.getUser());
            }
        });

        // Send update through each user channel
        Map<String, List<AbstractEntity>> map = new HashMap<>();
        users.forEach(user -> {
            map.put(user.getChannel(), entities);
        });

        // send it to admins too
        map.put(WebsocketFacade.ADMIN_LOBBY_CHANNEL, entities);

        // and eventually to the game channel
        map.put(this.getChannel(), entities);

        return map;
    }

    @Override
    public void setBeanjection(Beanjection beanjection) {
        this.beans = beanjection;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        return WegasPermission.getAsCollection(this.getAssociatedWritePermission());
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return WegasPermission.getAsCollection(this.getAssociatedReadPermission());
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission(RequestContext context) {
        // Only trainer can create games
        return WegasMembership.TRAINER;
    }

    @Override
    public Collection<WegasPermission> getRequieredDeletePermission(RequestContext context) {
        return WegasMembership.ADMIN;
    }

    @Override
    public WegasPermission getAssociatedReadPermission() {
        return Game.getAssociatedReadPermission(this.getId());
    }

    public static WegasPermission getAssociatedReadPermission(long id) {
        return new WegasEntityPermission(id, WegasEntityPermission.Level.READ, WegasEntityPermission.EntityType.GAME);
    }

    @Override
    public WegasPermission getAssociatedWritePermission() {
        return Game.getAssociatedWritePermission(this.getId());
    }

    public static WegasPermission getAssociatedWritePermission(long id) {
        return new WegasEntityPermission(id, WegasEntityPermission.Level.WRITE, WegasEntityPermission.EntityType.GAME);
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getGameModel();
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return false;
    }

    @Override
    public Visibility getInheritedVisibility() {
        return Visibility.INHERITED;
    }
}
