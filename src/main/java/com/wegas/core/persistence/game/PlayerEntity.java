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

import com.wegas.core.persistence.users.UserEntity;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;
import org.codehaus.jackson.annotate.JsonTypeInfo;
import org.eclipse.persistence.oxm.annotations.XmlInverseReference;

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
public class PlayerEntity extends AbstractEntity {

    private static final Logger logger = Logger.getLogger("PlayerEntity");
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "player_seq")
    private Long id;
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
    @XmlInverseReference(mappedBy = "players")
    @JsonBackReference(value = "player-user")
    private UserEntity user;
    /**
     * The game model this belongs to
     */
    @ManyToOne
    @NotNull
    @XmlTransient
    @XmlInverseReference(mappedBy = "players")
    @JsonBackReference(value = "player-team")
    @JoinColumn(name = "parentteam_id")
    private TeamEntity team;
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
        PlayerEntity p = (PlayerEntity) a;
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
    public UserEntity getUser() {
        return user;
    }

    /**
     * @param user the user to set
     */
    @JsonBackReference(value = "player-user")
    public void setUser(UserEntity user) {
        this.user = user;
    }

    /**
     * @return the team
     */
    @JsonBackReference(value = "player-team")
    public TeamEntity getTeam() {
        return team;
    }

    /**
     * @param team the team to set
     */
    @JsonBackReference(value = "player-team")
    public void setTeam(TeamEntity team) {
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
}
