
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.admin.persistence;

import com.wegas.admin.persistence.data.GameAdminTeam;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.ModelScoped.Visibility;
import com.wegas.core.security.util.WegasMembership;
import com.wegas.core.security.util.WegasPermission;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import javax.json.bind.Jsonb;
import javax.json.bind.JsonbBuilder;
import javax.json.bind.JsonbConfig;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.Lob;
import javax.persistence.NamedQuery;
import javax.persistence.OneToOne;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * To store game info required for invoicing.
 *
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

    private static final Logger logger = LoggerFactory.getLogger(GameAdmin.class);
    private static final long serialVersionUID = 1L;

    private static Jsonb jsonb = null;

    private static final Type TEAMLIST_TYPE = new ArrayList<GameAdminTeam>() {
        // static final to creat anonymous class only once
    }.getClass().getGenericSuperclass();

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

    private Long prevGameId;

    @Lob
    private String prevTeams;

    private Integer prevTeamCount;

    public GameAdmin() {
        // empty constructor
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
        } else {
            return Game.Status.SUPPRESSED;
        }
    }

    //
//    @JsonIgnore
//    public void setPrevTeamCount(Long prevTeamCount) {
//        this.prevTeamCount = prevTeamCount;
//    }
    public Long getGameId() {
        if (this.getGame() != null) {
            return this.getGame().getId();
        } else {
            return this.prevGameId;
        }
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
            this.prevTeams = mapper.toJson(this.getTeams());

            this.prevGameId = this.getGame().getId();
        }
    }

    public String getGameModelName() {
        if (this.getGame() != null) {
            return this.getGame().getGameModelName();
        } else {
            return this.getPrevGameModel();
        }
    }
//
//    @JsonIgnore
//    public void setPrevName(String prevName) {
//        this.prevName = prevName;
//    }

    public String getGameName() {

        if (this.getGame() != null) {
            return this.getGame().getName();
        } else {
            return this.getPrevName();
        }
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
        } else {
            return this.getPrevTeamCount();
        }
    }

    // Small optimization for getTeams():
    private static Jsonb getJsonb() {
        if (GameAdmin.jsonb == null) {
            JsonbConfig config = new JsonbConfig().withFormatting(false);
            GameAdmin.jsonb = JsonbBuilder.create(config);
        }
        return GameAdmin.jsonb;
    }

    public List<GameAdminTeam> getTeams() {
        if (this.getGame() != null) {
            final List<GameAdminTeam> teams = new ArrayList<>();

            for (Team t : this.getGame().getTeams()) {
                if (t instanceof DebugTeam == false) {
                    teams.add(new GameAdminTeam(t));
                }
            }
            return teams;
        } else {
            // Game has been deleted
            return this.getPrevTeams();
        }
    }

    @PrePersist
    public void initDatas() {
        this.creator = this.getGame().getCreatedByName();
        this.createdTime = this.getGame().getCreatedTime();
    }

    private List<GameAdminTeam> getPrevTeams() {
        if (Helper.isNullOrEmpty(prevTeams)) {
            return null;
        } else {
            return getJsonb().fromJson(prevTeams, TEAMLIST_TYPE);
        }
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
     */
    public enum Status {
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
