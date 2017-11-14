/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.persistence.AbstractEntity;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.JoinColumn;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.Table;

/**
 *
 * @author maxence
 */
@Entity
@Table(
        indexes = {
            @Index(columnList = "game_game_id")
        }
)
public class GameTeams extends AbstractEntity {

    private static final long serialVersionUID = 3932521135619132391L;

    @Id
    @GeneratedValue
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn
    private Game game;

    @OneToMany(mappedBy = "gameTeams", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Team> teams = new ArrayList<>();

    @Override
    public Long getId() {
        return id;
    }

    public Game getGame() {
        return game;
    }

    public void setGame(Game game) {
        this.game = game;
    }

    public List<Team> getTeams() {
        return teams;
    }

    public void setTeams(List<Team> teams) {
        this.teams = teams;
    }

    @Override
    public String getRequieredCreatePermission() {
        return game.getRequieredCreatePermission();
    }

    @Override
    public String getRequieredReadPermission() {
        return game.getRequieredReadPermission();
    }

    @Override
    public String getRequieredUpdatePermission() {
        /* CASE one: a closed game prevent player to leave
        switch (game.getAccess()) {
            case OPEN:
                return null; // everybody can register en new team
            default:
                return game.getRequieredUpdatePermission();
        }
        */
        // case TWO no restriction
        return null;
    }

    @Override
    public String getRequieredDeletePermission() {
        return game.getRequieredDeletePermission();
    }

    @Override
    public void merge(AbstractEntity other) {
    }
}
