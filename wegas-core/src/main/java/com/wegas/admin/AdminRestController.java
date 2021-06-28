/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.admin;

import com.wegas.admin.persistence.GameAdmin;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.shiro.authz.annotation.RequiresRoles;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Path("Admin/")
@Produces(MediaType.APPLICATION_JSON)
@RequiresRoles("Administrator")
public class AdminRestController {

    private static final Logger logger = LoggerFactory.getLogger(AdminRestController.class);

    @Inject
    private AdminFacade adminFacade;

    @POST
    @Path("GamesByIds")
    @Consumes(MediaType.APPLICATION_JSON)
    public Collection<GameAdmin> get(List<Long> ids) {
        return adminFacade.getByIds(ids);
    }

    @GET
    @Path("Game")
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
                    logger.error("Status not found: {}", ex);
                    //type not found
                }
            }
            return adminFacade.findByStatus(statuses.toArray(new GameAdmin.Status[statuses.size()]));
        }
    }

    @GET
    @Path("Game/Done")
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
     * Return of the list of all the GameAdmin linked to a game which will be destroyed at next
     * {@link AdminFacade#deleteGames()} schedule
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
