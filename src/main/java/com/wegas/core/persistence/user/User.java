/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.user;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(name = "users", uniqueConstraints =
@UniqueConstraint(columnNames = "name"))
@XmlRootElement
@XmlType(name = "User", propOrder = {"@class", "id", "name"})
public class User extends AbstractEntity {

    private static final Logger logger = Logger.getLogger("UserEntity");
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
    @Pattern(regexp = "^\\w+$")
    private String name;
    /**
     *
     *
     * @ManyToMany(cascade = CascadeType.ALL) @JoinTable(name = "user_player",
     * joinColumns = { @JoinColumn(name = "playerId")}, inverseJoinColumns = {
     * @JoinColumn(name = "userId")}) Collection<TeamEntity> players;
     */
    @OneToMany(mappedBy = "user",
    cascade = {CascadeType.ALL})
    @JsonManagedReference(value = "player-user")
    private List<Player> players;

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
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    /**
     * @return the players
     */
    @XmlTransient
    @JsonManagedReference(value = "player-user")
    public List<Player> getPlayers() {
        return players;
    }

    /**
     * @param players the players to set
     */
    @JsonManagedReference(value = "player-user")
    public void setPlayers(List<Player> players) {
        this.players = players;
    }
}
