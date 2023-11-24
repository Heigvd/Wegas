/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.security.util.WegasPermission;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

/**
 *
 * @author maxence
 */
@Entity
@Table(
        indexes = {
            @Index(columnList = "game_id")
        }
)
public class GameTeams extends AbstractEntity {

    private static final long serialVersionUID = 3932521135619132391L;

    @Id
    @GeneratedValue
    private Long id;

    @OneToOne(optional = false)
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
    public Collection<WegasPermission> getRequieredCreatePermission(RequestContext context) {
        return game.getRequieredCreatePermission(context);
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return game.getRequieredReadPermission(context);
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
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
    public Collection<WegasPermission> getRequieredDeletePermission(RequestContext context) {
        return game.getRequieredDeletePermission(context);
    }

    @Override
    public WithPermission getMergeableParent() {
        return getGame();
    }
}
