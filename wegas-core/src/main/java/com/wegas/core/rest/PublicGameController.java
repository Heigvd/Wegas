/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.security.util.SecurityHelper;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Iterator;
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
     * @param userId
     * @return
     */
    @GET
    @Path("PublicGames/{userId : [1-9][0-9]*}")
    public Collection<Game> publicGame(@PathParam("userId") Long userId) {
        final Collection<Game> retGames = new ArrayList<>();
        final Collection<Game> games = gameFacade.findAll("createdTime ASC");
        final Collection<Game> registeredGames = gameFacade.findRegisteredGames(userId);

        for (Iterator<Game> it = games.iterator(); it.hasNext();) {
            Game g = it.next();
            if (SecurityHelper.isPermitted(g, "View")
                    && !registeredGames.contains(g)) {
                retGames.add(g);
            }
        }
        return retGames;
    }

    /**
     *
     * @param userId
     * @return
     */
    @GET
    @Path("RegisteredGames/{userId : [1-9][0-9]*}/{gameModelId : [1-9][0-9]*}")
    public Collection<Game> registeredGames(@PathParam("userId") Long userId, @PathParam("gameModelId") Long gameModelId) {
        return (Collection) gameFacade.findRegisteredGames(userId, gameModelId);
    }

    /**
     *
     * @param userId
     * @return
     */
    @GET
    @Path("RegisteredGames/{userId : [1-9][0-9]*}/")
    public Collection<Game> registeredGames(@PathParam("userId") Long userId) {
        return (Collection) gameFacade.findRegisteredGames(userId);
    }
}
