/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.security.ejb.UserFacade;
import java.io.IOException;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.context.ExternalContext;
import javax.faces.context.FacesContext;
import org.apache.shiro.SecurityUtils;

/**
 *
 * Controls player access to games
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@ManagedBean(name = "gameController")
@RequestScoped
public class GameController extends AbstractGameController {

    @EJB
    private PlayerFacade playerFacade;
    @EJB
    private UserFacade userFacade;

    /**
     *
     * @throws IOException if the target we dispatch to do not exist
     */
    @PostConstruct
    public void init() throws IOException {
        final ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        if (this.playerId != null) {                                            // If a playerId is provided, we use it

            currentPlayer = playerFacade.find(this.getPlayerId());
            if (!userFacade.matchCurrentUser(currentPlayer.getId())) {
                externalContext.dispatch("/wegas-app/view/error/accessdenied.xhtml");
            }

            SecurityUtils.getSubject().checkPermission("Game:View:g" + currentPlayer.getGame().getId());

        }
        
        if (currentPlayer == null) {                                            // If no player could be found, we redirect to an error page
            externalContext.dispatch("/wegas-app/view/error/gameerror.xhtml");
        }
    }
}
