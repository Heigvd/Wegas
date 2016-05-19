/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.SecurityHelper;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel/{gameModelId : ([1-9][0-9]*)?}{sep: /?}Game/{gameId : ([1-9][0-9]*)?}{sep2: /?}Team/{teamId : [1-9][0-9]*}/Player")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class PlayerController {

    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    /**
     *
     */
    @EJB
    private TeamFacade teamFacade;
    /**
     *
     */
    @EJB
    private GameFacade gameFacade;

    /**
     *
     * @param playerId
     * @return
     */
    @GET
    @Path("{playerId : [1-9][0-9]*}")
    public Player get(@PathParam("playerId") Long playerId) {
        Player p = playerFacade.find(playerId);
        SecurityHelper.checkPermission(p.getGame(), "View");
        return playerFacade.find(playerId);
    }

    /**
     *
     * @fixme Returns ALL players in the server ....
     *
     * @param gameId
     * @return
     */
    @GET
    public Collection<Player> index(@PathParam("gameId") Long gameId) {
        SecurityHelper.checkPermission(gameFacade.find(gameId), "View");
        return playerFacade.findAll();
    }
    
    /**
     *
     * @param teamId
     * @return
     */
    @POST
    public Response create(@PathParam("teamId") Long teamId) {
        Response r = Response.status(Response.Status.UNAUTHORIZED).build();
        User currentUser = userFacade.getCurrentUser();
        if(currentUser != null){
            r = Response.status(Response.Status.BAD_REQUEST).build();
            Team teamToJoin = teamFacade.find(teamId);
            if(teamToJoin != null){
                r = Response.status(Response.Status.FORBIDDEN).build();
                if(
                    !(teamToJoin instanceof DebugTeam) 
                    && teamToJoin.getGame().getAccess() == Game.GameAccess.OPEN 
                    && !teamToJoin.getGame().getProperties().getFreeForAll()
                ){
                    Player existingPlayer = playerFacade.checkExistingPlayer(teamToJoin.getGameId(), currentUser.getId());
                    if(existingPlayer == null){
                        playerFacade.create(teamToJoin, currentUser);
                        r = Response.status(Response.Status.CREATED).entity(teamToJoin).build();
                    }
                }
            }
        }
        return r;        
    }

    /**
     *
     * @param playerId
     * @param entity
     * @return
     */
    @PUT
    @Path("{playerId: [1-9][0-9]*}")
    public Player update(@PathParam("playerId") Long playerId, Player entity) {
        SecurityHelper.checkPermission(playerFacade.find(playerId).getGame(), "Edit");
        return playerFacade.update(playerId, entity);
    }

    /**
     *
     * @param playerId
     * @return
     */
    @DELETE
    @Path("{playerId: [1-9][0-9]*}")
    public Player delete(@PathParam("playerId") Long playerId) {
        Player p = playerFacade.find(playerId);
        if (!userFacade.getCurrentUser().equals(p.getUser())) {
            SecurityHelper.checkPermission(p.getGame(), "Edit");
        }
        Team team = teamFacade.find(p.getTeamId());
        if(!(team instanceof DebugTeam)){
            if(team.getPlayers().size() == 1){
                teamFacade.remove(team);
            }else{
                playerFacade.remove(playerId);
            }
        }
        return p;
    }

    /**
     * Resets all the variables of a given player
     *
     * @param playerId playerId
     * @return OK
     */
    @GET
    @Path("{playerId : [1-9][0-9]*}/Reset")
    public Response reset(@PathParam("playerId") Long playerId) {
        Player p = playerFacade.find(playerId);

        if (!userFacade.getCurrentUser().equals(p.getUser())) {
            SecurityHelper.checkPermission(p.getGame(), "Edit");
        }
        playerFacade.reset(p);
        return Response.ok().build();
    }
}
