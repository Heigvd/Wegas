/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.persistence.token;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.servlet.http.HttpServletRequest;

/**
 *
 * @author maxence
 */
@Entity
public class InviteToJoinToken extends Token {

    @JsonIgnore
    @ManyToOne
    private Game game;

    @JsonIgnore
    @ManyToOne
    private Team team;

    public Game getGame() {
        return game;
    }

    public void setGame(Game game) {
        this.game = game;
    }

    public Team getTeam() {
        return team;
    }

    public void setTeam(Team team) {
        this.team = team;
    }

    public String getRedirectTo() {
        if (game != null) {
            if (game.getProperties().getFreeForAll()) {
                return "game-play.html?gameId=" + game.getId();
            } else {
                // strage configuration
                // redirect to join team model
                return "/#/play/" + game.getToken();
            }
        } else if (team != null) {
            return "game-play.html?gameId=" + team.getGame().getId();
        }
        return "/";
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        if (this.getTeam() != null) {
            // team members or game trainers
            return this.getTeam().getRequieredUpdatePermission();
        } else if (this.getGame() != null) {
            // Game trainers
            return this.getGame().getRequieredUpdatePermission();
        } else {
            return super.getRequieredCreatePermission();
        }
    }

    @Override
    public void process(AccountFacade accountFacade, HttpServletRequest request) {
        accountFacade.processJoin(this, request);
    }
}
