/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.admin;

import com.wegas.admin.persistence.GameAdmin;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.shiro.authz.annotation.RequiresRoles;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("Admin/")
@Produces(MediaType.APPLICATION_JSON)
@RequiresRoles("Administrator")
public class AdminRestController {

    @Inject
    private AdminFacade adminFacade;

    @Path("Game")
    @GET
    public Collection<GameAdmin> get(@QueryParam("type") String type) {
        if (type == null) {
            return adminFacade.findAll();
        } else {
            String[] types = type.split(",");
            List<GameAdmin.Status> statuses = new ArrayList<>();
            for (int i = 0; i < types.length; i++) {
                try {
                    statuses.add(GameAdmin.Status.valueOf(types[i].toUpperCase()));
                } catch (IllegalArgumentException ex) {
                    //type not found
                }
            }
            return adminFacade.findByStatus(statuses.toArray(new GameAdmin.Status[statuses.size()]));
        }
    }

    @Path("Game/Done")
    @GET
    public Collection<GameAdmin> getDone() {
        return adminFacade.findDone();
    }

    @GET
    @Path("Game/{gameId : ([1-9][0-9]*)}")
    public GameAdmin get(@PathParam("gameId") Long gameId) {
        return adminFacade.find(gameId);
    }

    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Path("Game/{gameId : ([1-9][0-9]*)}")
    public GameAdmin update(@PathParam("gameId") Long gameId, GameAdmin game) {
        return adminFacade.update(gameId, game);
    }

    @GET
    @Path("rebuild")
    public Response rebuild() {
        adminFacade.rebuild();
        return Response.ok().build();
    }

    /**
     * Return of the list of all the GameAdmin linked to a game which will be
     * destroyed at next {@link AdminFacade#deleteGames()} schedule
     *
     * @return list of adminGame
     */
    @GET
    @Path("todelete")
    public List<GameAdmin> getToDelete() {
        return adminFacade.getGameToDelete();
    }

    /**
     * Manually trigger {@link AdminFacade#deleteGames()}
     */
    @DELETE
    @Path("deleteAll")
    public void delete() {
        adminFacade.deleteGames();
    }

    @DELETE
    @Path("Game/delete/{gameAdminId : ([1-9][0-9]*)}")
    public GameAdmin deleteGame(@PathParam("gameAdminId") Long gameAdminId) {
        adminFacade.deleteGame(adminFacade.find(gameAdminId));
        return adminFacade.find(gameAdminId);
    }
}
