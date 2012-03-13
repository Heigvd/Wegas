/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.game;

import java.util.List;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonManagedReference;
import org.eclipse.persistence.oxm.annotations.XmlInverseReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"name"}))
@Inheritance(strategy = InheritanceType.JOINED)
@XmlType(name = "Team")
@JsonIgnoreProperties(ignoreUnknown = true)
public class TeamEntity extends AbstractEntity {

    private static final Logger logger = Logger.getLogger("GroupEntity");
    /**
     *
     */
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "team_seq")
    private Long id;
    /**
     *
     */
    @NotNull
    private String name;
    /**
     *
     */
    @OneToMany(mappedBy = "team", cascade = {CascadeType.ALL})
    @JsonManagedReference(value = "player-team")
    private List<PlayerEntity> players;
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
    @XmlTransient
    @XmlInverseReference(mappedBy = "teams")
    @JoinColumn(name = "parentgame_id")
    @JsonBackReference(value = "game-team")
    private GameEntity game;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        TeamEntity t = (TeamEntity) a;
        this.setName(t.getName());
    }

    /**
     * @return the gameModel
     */
    @JsonBackReference(value = "game-team")
    public GameEntity getGame() {
        return game;
    }

    /**
     * @param game the gameModel to set
     */
    @JsonBackReference(value = "game-team")
    public void setGame(GameEntity game) {
        this.game = game;
    }

    /**
     * @return the players
     */
    @JsonManagedReference(value = "player-team")
    public List<PlayerEntity> getPlayers() {
        return players;
    }

    /**
     *
     * @param p
     */
    @XmlTransient
    public void addPlayer(PlayerEntity p) {
        this.players.add(p);
        p.setTeam(this);
    }

    /**
     * @param players the players to set
     */
    @JsonManagedReference(value = "player-team")
    public void setPlayers(List<PlayerEntity> players) {
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
     * @param id
     */
    @Override
    public void setId(Long id) {
        this.id = id;
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
}
