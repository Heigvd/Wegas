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
import com.wegas.core.persistence.NamedEntity;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlID;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonBackReference;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"game_id", "name"}))
public class Game extends NamedEntity implements Serializable {

    private static final Logger logger = Logger.getLogger("GameEntity");
    /**
     *
     */
    @Id
    @XmlID
    @Column(name = "game_id")
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @NotNull
    //@Pattern(regexp = "^\\w+$")
    private String name;
    /**
     *
     */
    @NotNull
    // @Pattern(regexp = "^\\w+$")
    private String token;
    /**
     *
     */
    @OneToMany(mappedBy = "game", cascade = {CascadeType.ALL}, orphanRemoval = true)
    @JsonManagedReference("game-team")
    private List<Team> teams = new ArrayList<Team>();
    /**
     *
     */
    @ManyToOne
    @JoinColumn(name = "gamemodelid")
    // @JsonBackReference
    private GameModel gameModel;

    /**
     *
     */
    public Game() {
    }

    /**
     *
     * @param name
     * @param token
     */
    public Game(String name, String token) {
        this.name = name;
        this.token = token;
    }

    /**
     *
     */
    @PrePersist
    public void prePersist() {
        if (this.token == null) {
            this.setToken(this.getName().replace(" ", ""));
        }
    }

    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        Game other = (Game) a;
        this.setToken(other.getToken());
    }

    /**
     * @return the teams
     */
    @JsonManagedReference("game-team")
    public List<Team> getTeams() {
        return this.teams;
    }

    /**
     * @param teams the teams to set
     */
    @JsonManagedReference("game-team")
    public void setTeams(List<Team> teams) {
        this.teams = teams;
    }

    /**
     *
     * @param t
     */
    @XmlTransient
    public void addTeam(Team t) {
        this.teams.add(t);
        t.setGame(this);
    }

    /**
     * @return the gameModel
     */
    @JsonBackReference
    public GameModel getGameModel() {
        return gameModel;
    }

    /**
     * @param gameModel the gameModel to set
     */
    @JsonBackReference
    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    /**
     *
     */
    /*
     * public void reset(AnonymousEntityManager aem) { for
     * (VariableDescriptorEntity vd : this.getVariableDescriptors()) {
     * vd.getScope().reset(aem); } }
     */
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
    @Override
    public String getName() {
        return name;
    }

    /**
     *
     * @param name
     */
    @Override
    public void setName(String name) {
        this.name = name;
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
