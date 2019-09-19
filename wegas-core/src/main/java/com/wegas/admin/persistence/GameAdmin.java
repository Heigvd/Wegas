/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.admin.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import javax.json.bind.Jsonb;
import javax.json.bind.JsonbBuilder;
import javax.json.bind.JsonbConfig;
import javax.json.bind.JsonbException;
import javax.persistence.*;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@NamedQuery(name = "GameAdmin.findByGameIds",
        query = "SELECT DISTINCT ga FROM GameAdmin ga WHERE ga.game.id in :ids")
@NamedQuery(name = "GameAdmin.findByGame",
        query = "SELECT DISTINCT ga FROM GameAdmin ga WHERE ga.game.id = :gameId")
@NamedQuery(name = "GameAdmin.findByStatus",
        query = "SELECT DISTINCT ga FROM GameAdmin ga WHERE ga.status = :status ORDER BY ga.createdTime DESC")
@NamedQuery(name = "GameAdmin.GamesToDelete",
        query = "SELECT DISTINCT ga FROM GameAdmin ga WHERE ga.status = com.wegas.admin.persistence.GameAdmin.Status.PROCESSED AND ga.game.status = com.wegas.core.persistence.game.Game.Status.DELETE")
@Table(
        indexes = {
            @Index(columnList = "game_id")
        }
)
@JsonIgnoreProperties(ignoreUnknown = true)
public class GameAdmin extends AbstractEntity {

    private static final long serialVersionUID = 1L;

    private static Jsonb jsonb = null;

    @Id
    @GeneratedValue
    private Long id;

    @Lob
    @WegasEntityProperty
    private String comments;

    @OneToOne
    private Game game;

    private String creator;

    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date createdTime;

    @Enumerated(value = EnumType.STRING)
    @Column(length = 24)
    @WegasEntityProperty
    private Status status = Status.TODO;

    private String prevName;

    private String prevGameModel;

    @Lob
    private String prevPlayers;

    private Long prevGameId;

    @Lob
    private String prevTeams;

    private Integer prevTeamCount;

    public GameAdmin() {
    }

    public GameAdmin(Game game) {
        this.game = game;
    }

    @Override
    public Long getId() {
        return this.id;
    }

    public String getComments() {
        return comments;
    }

    public void setComments(String comments) {
        this.comments = comments;
    }

    public Status getStatus() {
        return status;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    @JsonIgnore
    public Game getGame() {
        return game;
    }

    public void setGame(Game game) {
        this.game = game;
    }

    public Game.Status getGameStatus() {
        if (this.getGame() != null) {
            return this.getGame().getStatus();
        }
        return Game.Status.SUPPRESSED;
    }

    //
//    @JsonIgnore
//    public void setPrevTeamCount(Long prevTeamCount) {
//        this.prevTeamCount = prevTeamCount;
//    }
    public Long getGameId() {
        if (this.getGame() != null) {
            return this.getGame().getId();
        }
        return this.prevGameId;
    }

    public Date getCreatedTime() {
        return createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    public String getCreator() {
        return this.creator;
    }

    @JsonIgnore
    public void populate() {
        if (this.getGame() != null) {
            this.prevGameModel = this.getGameModelName();
            this.prevName = this.getGameName();
            this.prevTeamCount = this.getTeamCount();

            Jsonb mapper = getJsonb();
            this.prevPlayers = mapper.toJson(this.getPlayers());

            this.prevTeams = this.getTeams().toString();

            this.prevGameId = this.getGame().getId();
        }
    }

    public String getGameModelName() {
        if (this.getGame() != null) {
            return this.getGame().getGameModelName();
        }
        return this.getPrevGameModel();
    }
//
//    @JsonIgnore
//    public void setPrevName(String prevName) {
//        this.prevName = prevName;
//    }

    public String getGameName() {

        if (this.getGame() != null) {
            return this.getGame().getName();
        }
        return this.getPrevName();
    }

    //
//    @JsonIgnore
//    public void setPrevGameModel(String prevGameModel) {
//        this.prevGameModel = prevGameModel;
//    }
//
    public Integer getTeamCount() {
        if (this.getGame() != null) {
            int counter = 0;
            for (Team t : this.getGame().getTeams()) {
                if (t.getClass() == Team.class) { // filter debugTeam
                    counter++;
                }
            }
            return counter;
        }
        return this.getPrevTeamCount();
    }

    // Small optimization for getTeams():
    private static Jsonb getJsonb() {
        if (GameAdmin.jsonb == null) {
            JsonbConfig config = new JsonbConfig().withFormatting(true);
            GameAdmin.jsonb = JsonbBuilder.create(config);
        }
        return GameAdmin.jsonb;
    }

    public List<String> getTeams() {
        if (this.getGame() != null) {
            final List<String> teams = new ArrayList<>();
            for (Team t : this.getGame().getTeams()) {
                if (t.getClass() == Team.class) { // filter debugTeam
                    GameAdminTeam gaTeam = new GameAdminTeam(t);
                    try {
                        teams.add(getJsonb().toJson(gaTeam));
                    } catch (JsonbException e) {
                        e.printStackTrace();
                    }
                }
            }
            return teams;
        }
        return this.getPrevTeams();
    }

    public List<String> getPlayers() {
        if (this.getGame() != null) {
            final List<Player> players = new ArrayList<>();
            for (Team t : this.getGame().getTeams()) {
                if (t.getClass() == Team.class) { // filter debugTeam
                    players.addAll(t.getPlayers());
                }
            }
            final List<String> playersName = new ArrayList<>();
            for (Player p : players) {
                playersName.add(p.getName());
            }
            return playersName;
        }
        return this.getPrevPlayers();
    }

    public void setPlayers(List<String> players) {
    }

    @PrePersist
    public void initDatas() {
        this.creator = this.getGame().getCreatedByName();
        this.createdTime = this.getGame().getCreatedTime();
    }

    private List<String> getPrevPlayers() {
        return getJsonb().fromJson(this.prevPlayers, ArrayList.class);
    }

    private List<String> getPrevTeams() {
        final List<String> teams = new ArrayList<>();
        if (this.prevTeams != null) {
            Jsonb mapper = getJsonb();
            ArrayList prev = mapper.fromJson(this.prevTeams, ArrayList.class);
            for (Object p : prev) {
                teams.add(mapper.toJson(p));
            }
        }

        return teams;
    }

    private String getPrevGameModel() {
        return prevGameModel;
    }

    private String getPrevName() {
        return prevName;
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        return WegasMembership.TRAINER;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return WegasMembership.ADMIN;
    }

    //
//    @JsonIgnore
//    public void setPrevPlayers(String prevPlayers) {
//        this.prevPlayers = prevPlayers;
//    }
//
    @JsonIgnore
    private Integer getPrevTeamCount() {
        return prevTeamCount;
    }

    @Override
    public boolean belongsToProtectedGameModel() {
        return false;
    }

    @Override
    public WithPermission getMergeableParent() {
        return null;
    }

    @Override
    public Visibility getInheritedVisibility() {
        return Visibility.INHERITED;
    }

    /**
     * GameAdmin status
     * {
     *
     * @
     */
    public static enum Status {
        /**
         * Initial status, not yet processed
         */
        TODO,
        /**
         * Processed means processed but not charged (test games, etc)
         */
        PROCESSED,
        /**
         * Real world games which have been charged
         */
        CHARGED
    }
}
