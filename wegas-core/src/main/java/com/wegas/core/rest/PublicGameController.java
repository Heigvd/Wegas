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
import com.wegas.core.security.ejb.UserFacade;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
@Stateless
@Path("/")
    @Produces(MediaType.APPLICATION_JSON)
public class PublicGameController {

    /**
     *
     */
    @EJB
    private GameFacade gameFacade;
    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    /**
     *
     * @param userId
     * @return
     */
    @GET
    @Path("PublicGames/Games/{userId : [1-9][0-9]*}")
    public Collection<Game> publicGame(@PathParam("userId") Long userId) {
        return gameFacade.getPublicGames(userId);
    }

    /**
     *
     * @param userId
     * @return
     */
    @GET
    @Path("RegisteredGames/{userId : [1-9][0-9]*}/")
    public Collection<Game> registeredGames(@PathParam("userId") Long userId) {
        return (Collection) userFacade.registeredGames(userId);
    }
}
