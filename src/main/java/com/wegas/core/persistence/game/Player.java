/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.game;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.user.User;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
//@Table(uniqueConstraints =
//@UniqueConstraint(columnNames = {"name"}))
@Inheritance(strategy = InheritanceType.JOINED)
@XmlRootElement
@XmlType(name = "Player", propOrder = {"@class", "id", "name"})
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonIgnoreProperties(ignoreUnknown = true)
public class Player extends AbstractEntity {

    private static final Logger logger = Logger.getLogger("PlayerEntity");
    @Id
    @GeneratedValue
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
    /*
     * @ManyToMany(cascade = CascadeType.ALL) @JoinTable(name = "user_player",
     * joinColumns = { @JoinColumn(name = "userId") }, inverseJoinColumns = {
     * @JoinColumn(name = "playerId") }) private Collection<UserEntity> users;
     */
    /**
     *
     */
    @ManyToOne(cascade = {CascadeType.PERSIST})
    @XmlTransient
   // @XmlInverseReference(mappedBy = "players")
    @JsonBackReference(value = "player-user")
    private User user;
    /**
     * The game model this belongs to
     */
    @ManyToOne
    @NotNull
    @XmlTransient
   // @XmlInverseReference(mappedBy = "players")
    @JsonBackReference(value = "player-team")
    @JoinColumn(name = "parentteam_id")
    private Team team;
    /**
     *
     */
    @Column(name = "parentteam_id", nullable = false, insertable = false, updatable = false)
    private int teamId;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        Player p = (Player) a;
        this.setName(p.getName());
    }

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        if (this.name == null) {
            this.setName(this.user.getName());
        }
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

    /**
     * @return the teamId
     */
    public int getTeamId() {
        return teamId;
    }

    // *** Sugar *** //
    /**
     *
     * @return
     */
    @XmlTransient
    public GameModel getGameModel() {
        return this.getTeam().getGame().getGameModel();
    }
    /**
     *
     * @return
     */
    @XmlTransient
    public Game getGame() {
        return this.getTeam().getGame();
    }
}
