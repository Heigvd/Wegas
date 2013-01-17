/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.game;

import com.wegas.core.persistence.AbstractEntity;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
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
@XmlType(name = "Team")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Team extends AbstractEntity {

    private static final Logger logger = Logger.getLogger("GroupEntity");
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
    private List<Player> players = new ArrayList<Player>();
    /**
     *
     */
    @Column(name = "parentgame_id", nullable = false, insertable = false, updatable = false)
    private int gameId;
    /**
     * The game model this belongs to
     */
    @ManyToOne
    @NotNull
    @JoinColumn(name = "parentgame_id")
    @XmlTransient
    //@XmlInverseReference(mappedBy = "teams")
    @JsonBackReference(value = "game-team")
    private Game game;

    public Team() {
    }

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

    @PrePersist
    @PreUpdate
    public void prePersist() {
        if (this.getToken() == null) {
            this.setToken(this.getName());
        }
        this.token = this.token.replace(" ", "-");
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
    public int getGameId() {
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
