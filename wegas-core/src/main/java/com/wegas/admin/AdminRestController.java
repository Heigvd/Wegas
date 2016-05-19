/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.admin;

import com.wegas.admin.persistence.GameAdmin;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import org.apache.shiro.authz.annotation.RequiresRoles;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("Admin/")
@Produces(MediaType.APPLICATION_JSON)
@RequiresRoles("Administrator")
public class AdminRestController {

    @EJB
    private AdminFacade adminFacade;

    @Path("Game")
    @GET
    public Collection<GameAdmin> get(@QueryParam("type") String type) {
        String[] types = type.split(",");
        if (type == null) {
            return adminFacade.findAll();
        } else {
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

    @DELETE
    @Path("Game/delete/{gameAdminId : ([1-9][0-9]*)}")
    public GameAdmin deleteGame(@PathParam("gameAdminId") Long gameAdminId) {
        adminFacade.deleteGame(adminFacade.find(gameAdminId));
        return adminFacade.find(gameAdminId);
    }
}
