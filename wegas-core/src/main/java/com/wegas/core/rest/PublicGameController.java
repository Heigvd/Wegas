/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.persistence.game.Game;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
@Stateless
@Path("PublicGames")
public class PublicGameController {

    
    @EJB
    private GameFacade gameFacade;

    @GET
    @Path("/Games/")
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<Game> publicGame() {
        return gameFacade.getPublicGames();
    }

}
