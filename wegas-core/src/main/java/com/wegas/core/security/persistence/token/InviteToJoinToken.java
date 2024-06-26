/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.persistence.token;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import jakarta.persistence.Entity;
import jakarta.persistence.ManyToOne;
import jakarta.servlet.http.HttpServletRequest;

/**
 *
 * @author maxence
 */
@Entity
public class InviteToJoinToken extends Token {

    private static final long serialVersionUID = 1L;

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

    @Override
    public String getRedirectTo() {
        if (game != null) {
            if (game.getProperties().getFreeForAll()) {
                return "game-play.html?gameId=" + game.getId();
            } else {
                // redirect to join team model
                return "/#/play/" + game.getToken();
            }
        } else if (team != null) {
            return "game-play.html?gameId=" + team.getGame().getId();
        }
        return "/";
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission(RequestContext context) {
        if (this.getTeam() != null) {
            // team members or game trainers
            return this.getTeam().getRequieredUpdatePermission(context);
        } else if (this.getGame() != null) {
            // Game trainers
            return this.getGame().getRequieredUpdatePermission(context);
        } else {
            return super.getRequieredCreatePermission(context);
        }
    }

    @Override
    public void process(AccountFacade accountFacade, HttpServletRequest request) {
        accountFacade.processJoin(this, request);
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        if (this.game != null) {
            GameFacade gameFacade = beans.getGameFacade();
            Game find = gameFacade.find(game.getId());
            if (find != null) {
                game.removeInvitation(this);
            }
        }

        super.updateCacheOnDelete(beans);
    }
}
