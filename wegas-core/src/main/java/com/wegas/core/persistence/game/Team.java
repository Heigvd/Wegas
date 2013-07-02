/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(uniqueConstraints =
        @UniqueConstraint(columnNames = {"name", "parentgame_id"}))
@Inheritance(strategy = InheritanceType.JOINED)
@NamedQueries({
    @NamedQuery(name = "findTeamByToken", query = "SELECT team FROM Team team WHERE team.token = :token")
})
@JsonIgnoreProperties(ignoreUnknown = true)
public class Team extends AbstractEntity {

    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @NotNull
    private String name;
    /**
     *
     */
    @NotNull
    private String token;
    /**
     *
     */
    @OneToMany(mappedBy = "team", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference(value = "player-team")
    private List<Player> players = new ArrayList<>();
    /**
     * The game model this belongs to
     */
    @ManyToOne(optional = false)
    @NotNull
    @JoinColumn(name = "parentgame_id")
    @XmlTransient
    //@XmlInverseReference(mappedBy = "teams")
    @JsonBackReference(value = "game-team")
    private Game game;
    /**
     *
     */
    @Column(name = "parentgame_id", nullable = false, insertable = false, updatable = false)
    private Long gameId;

    /**
     *
     */
    public Team() {
    }

    /**
     *
     * @param name
     */
    public Team(String name) {
        this.name = name;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Team t = (Team) a;
        this.setName(t.getName());
        this.setToken(t.getToken());
    }

    /**
     *
     */
    @PrePersist
    @PreUpdate
    public void prePersist() {
        if (this.getToken() == null || this.getToken().equals("")) {
            this.setToken(Helper.genToken(10));
        }
        //this.token = this.token.replace(" ", "-");
    }

    /**
     * @return the gameModel
     */
    @JsonBackReference(value = "game-team")
    public Game getGame() {
        return game;
    }

    /**
     * @param game the gameModel to set
     */
    @JsonBackReference(value = "game-team")
    public void setGame(Game game) {
        this.game = game;
    }

    /**
     * @return the players
     */
    @JsonManagedReference(value = "player-team")
    public List<Player> getPlayers() {
        return players;
    }

    /**
     *
     * @param p
     */
    @XmlTransient
    public void addPlayer(Player p) {
        this.players.add(p);
        p.setTeam(this);
    }

    /**
     * @param players the players to set
     */
    @JsonManagedReference(value = "player-team")
    public void setPlayers(List<Player> players) {
        this.players = players;
    }

    /**
     *
     */
    @Override
    public String toString() {
        return this.name;
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
    public String getName() {
        return name;
    }

    /**
     *
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }

    /**
     * @return the gameId
     */
    public Long getGameId() {
        return gameId;
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
}
