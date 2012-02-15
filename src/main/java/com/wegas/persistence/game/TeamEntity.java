/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.persistence.game;

import java.util.List;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonManagedReference;
import org.codehaus.jackson.annotate.JsonTypeInfo;
import org.eclipse.persistence.oxm.annotations.XmlInverseReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"name"}))
@Inheritance(strategy = InheritanceType.JOINED)
@XmlRootElement
@XmlType(name = "Team", propOrder = {"@class", "id", "name"})
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class TeamEntity extends AnonymousEntity {

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
    // @javax.validation.constraints.Pattern(regexp = "^\\w+$")
    private String name;
    /**
     * 
     */
    @OneToMany(mappedBy = "team", cascade = {CascadeType.ALL})
    @JsonManagedReference(value = "player-team")
    private List<PlayerEntity> players;
    /**
     * The game model this belongs to
     */
    @ManyToOne
    @NotNull
    @XmlTransient
    @XmlInverseReference(mappedBy = "teams")
    @JsonBackReference(value = "game-team")
    private GameEntity game;

    /**
     * 
     * @param a
     */
    @Override
    public void merge(AnonymousEntity a) {
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
}
