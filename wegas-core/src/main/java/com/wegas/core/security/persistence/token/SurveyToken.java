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
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.util.WegasMembership;
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
public class SurveyToken extends Token {

    // for testing purpose
    // should be linked to surveys descriptors
    @JsonIgnore
    @ManyToOne
    private Game game;

    public Game getGame() {
        return game;
    }

    public void setGame(Game game) {
        this.game = game;
    }

    public String getRedirectTo() {
        return "/survey.html?surveysId=n/a";
    }

    public void process(AccountFacade accountFacade, HttpServletRequest request) {
        // TODO
    }

    @Override
    public Collection<WegasPermission> getRequieredCreatePermission() {
        if (this.getGame() != null) {
            return this.getGame().getRequieredUpdatePermission();
        } else {
            return WegasMembership.ADMIN;
        }
    }
}
