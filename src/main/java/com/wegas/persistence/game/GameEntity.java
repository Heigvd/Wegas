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

import java.io.Serializable;
import java.util.List;
import java.util.logging.Logger;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.JoinColumn;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
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
@UniqueConstraint(columnNames = "name"))
@XmlType(name = "Game")
public class GameEntity extends NamedEntity implements Serializable {

    private static final Logger logger = Logger.getLogger("GameEntity");
    /**
     * 
     */
    @Id
    @XmlID
    @Column(name = "game_id")
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "game_seq")
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
    @Pattern(regexp = "^\\w+$")
    private String token;
    /**
     * 
     */
    @OneToMany(mappedBy = "game", cascade = {CascadeType.ALL})
    @JsonManagedReference("game-team")
    private List<TeamEntity> teams;
    /**
     * 
     */
    @ManyToOne
    @JoinColumn(name = "gamemodel_id")
    // @JsonBackReference("gamemodel-game")
    private GameModelEntity gameModel;

    /**
     * 
     */
    @PrePersist
    public void prePersist() {
        this.setToken(this.getName().replace(" ", ""));
    }

    @Override
    public void merge(AnonymousEntity n) {
        super.merge(n);
        GameEntity g = (GameEntity) n;
        this.setToken(g.getToken());
    }

    /**
     * @return the teams
     */
    @JsonManagedReference("game-team")
    public List<TeamEntity> getTeams() {
        return this.teams;
    }

    /**
     * @param teams the teams to set
     */
    @JsonManagedReference("game-team")
    public void setTeams(List<TeamEntity> teams) {
        this.teams = teams;
    }

    @XmlTransient
    public void addTeam(TeamEntity t) {
        this.teams.add(t);
        t.setGame(this);
    }

    /**
     * @return the gameModel
     */
    @JsonBackReference("gamemodel-game")
    public GameModelEntity getGameModel() {
        return gameModel;
    }

    /**
     * @param gameModel the gameModel to set
     */
    @JsonBackReference("gamemodel-game")
    public void setGameModel(GameModelEntity gameModel) {
        this.gameModel = gameModel;
    }

    /**
     * 
     */
    /*public void reset(AnonymousEntityManager aem) {
    for (VariableDescriptorEntity vd : this.getVariableDescriptors()) {
    vd.getScope().reset(aem);
    }
    }*/
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
