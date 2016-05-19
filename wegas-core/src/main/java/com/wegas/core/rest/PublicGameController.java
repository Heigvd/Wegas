/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.security.util.SecurityHelper;
import java.util.ArrayList;
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
 * @author Yannick Lagger (lagger.yannick.com)
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
    @Path("PublicGames")
    public Collection<Game> publicGames() {
        return gameFacade.findPublicGamesByRole("Public");// Find public games
    }

    /**
     *
     * @param userId
     * @return
     */
    @GET
    @Path("PublicGames/{userId : [1-9][0-9]*}")
    public Collection<Game> publicGame(@PathParam("userId") final Long userId) {
        final Collection<Game> ret = new ArrayList<>();
        //final Collection<Game> games = gameFacade.findAll("createdTime ASC"); // Find public games
        final Collection<Game> games = gameFacade.findPublicGamesByRole("Public");// Find public games

        final Collection<Game> registeredGames = gameFacade.findRegisteredGames(userId);
        for (Game g : games) {                                                  // Select games that are viewable and not already registered
            if (SecurityHelper.isPermitted(g, "View") && !registeredGames.contains(g)) {
                ret.add(g);
            }
        }
        return ret;
    }

    ///**
    //*
    //* @param userId
    //* @return
    //*/
    //@GET
    //@Path("AvailableGames/{userId : [1-9][0-9]*}")
    //public Collection<Game> availableGames(@PathParam("userId") Long userId) {
    //    final Collection<Game> retGames = new ArrayList<>();
    //    final Collection<Game> games = gameFacade.findAll("createdTime ASC");
    //    final Collection<Game> registeredGames = gameFacade.findRegisteredGames(userId);
    //    for (Game g : games) {
    //        if (SecurityHelper.isAnyPermitted(g, Arrays.asList("View", "Token"))
    //                && !registeredGames.contains(g)) {
    //            retGames.add(g);
    //        }
    //    }
    //    return retGames;
    //}
    /**
     *
     * @param userId
     * @param gameModelId
     * @return
     */
    @GET
    @Path("RegisteredGames/{userId : [1-9][0-9]*}/{gameModelId : [1-9][0-9]*}")
    public Collection<Game> registeredGames(@PathParam("userId") Long userId, @PathParam("gameModelId") Long gameModelId) {
        return gameFacade.findRegisteredGames(userId, gameModelId);
    }

    /**
     *
     * @param userId
     * @return
     */
    @GET
    @Path("RegisteredGames/{userId : [1-9][0-9]*}/")
    public Collection<Game> registeredGames(@PathParam("userId") Long userId) {
        return gameFacade.findRegisteredGames(userId);
    }
}
