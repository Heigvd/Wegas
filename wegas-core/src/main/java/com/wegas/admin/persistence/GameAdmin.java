/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.admin.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.ObjectWriter;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@NamedQueries({
    @NamedQuery(name = "GameAdmin.findByGame", query = "SELECT DISTINCT ga FROM GameAdmin ga WHERE ga.game.id = :gameId"),
    @NamedQuery(name = "GameAdmin.findByStatus", query = "SELECT DISTINCT ga FROM GameAdmin ga WHERE ga.status = :status ORDER BY ga.createdTime DESC"),
    @NamedQuery(name = "GameAdmin.GamesToDelete", query = "SELECT DISTINCT ga FROM GameAdmin ga WHERE ga.status != com.wegas.admin.persistence.GameAdmin.Status.TODO AND ga.game.status = com.wegas.core.persistence.game.Game.Status.DELETE")
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class GameAdmin extends AbstractEntity {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    private Long id;

    @Lob
    private String comments;

    @OneToOne
    @JoinColumn(nullable = true)
    private Game game;

    private String creator;

    @Temporal(value = TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date createdTime;

    @Enumerated(value = EnumType.STRING)
    @Column(length = 24)
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

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof GameAdmin) {
            GameAdmin o = (GameAdmin) other;
            this.setStatus(o.getStatus());
            this.setComments(o.getComments());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + other.getClass().getSimpleName() + ") is not possible");
        }
    }

    @JsonIgnore
    public void populate() {
        if (this.getGame() != null) {
            this.prevGameModel = this.getGameModelName();
            this.prevName = this.getGameName();
            this.prevTeamCount = this.getTeamCount();
            this.prevPlayers = this.getPlayers().toString();
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
    private static ObjectWriter ow = new ObjectMapper().writer();

    public List<String> getTeams() {
        if (this.getGame() != null) {
            final List<String> teams = new ArrayList<>();
            for (Team t : this.getGame().getTeams()) {
                if (t.getClass() == Team.class) { // filter debugTeam
                    GameAdminTeam gaTeam = new GameAdminTeam(t);
                    try {
                        teams.add(ow.writeValueAsString(gaTeam));
                    } catch (JsonProcessingException e) {
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
        final List<String> players = new ArrayList<>();
        JSONArray ar;
        try {
            ar = new JSONArray(this.prevPlayers);
            for (int i = 0; i < ar.length(); i++) {
                players.add(ar.get(i).toString());
            }
        } catch (JSONException e) {
            e.printStackTrace();
        }

        return players;
    }

    private List<String> getPrevTeams() {
        final List<String> teams = new ArrayList<>();
        JSONArray ar;
        if (this.prevTeams != null) {
            try {
                ar = new JSONArray(this.prevTeams);
                for (int i = 0; i < ar.length(); i++) {
                    teams.add(ar.get(i).toString());
                }
            } catch (JSONException e) {
                e.printStackTrace();
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

    public enum Status {
        /**
         * Initial status
         */
        TODO,
        /**
         *
         */
        PROCESSED,
        /**
         *
         */
        CHARGED
    }
}
