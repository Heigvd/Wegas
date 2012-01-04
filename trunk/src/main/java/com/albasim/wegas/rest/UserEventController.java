/*
 * MetAlbasim is super koool. http://www.albasim.com
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 *
 * MetAlbasim is distributed under the ??? license
 *
 */
package com.albasim.wegas.rest;

import com.albasim.wegas.comet.Terminal;
import com.albasim.wegas.ejb.Dispatcher;
import com.albasim.wegas.ejb.GameModelManager;
import com.albasim.wegas.ejb.GmTypeManager;
import com.albasim.wegas.ejb.GmUserEventManager;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.persistance.GameModel;
import com.albasim.wegas.persistance.GmType;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistance.GmUserEvent;

import java.util.Collection;

import java.util.logging.Logger;

import javax.ejb.EJB;
import javax.ejb.Stateless;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author maxence
 */
@Stateless
@Path("gm/{gmID : [1-9][0-9]*}/type/{tID : [1-9][0-9]*}/event")
public class UserEventController {

    private static final Logger logger = Logger.getLogger("Authoring_GM_Event");


    @Context
    HttpServletRequest request;


    @EJB
    Dispatcher dispatcher;


    @EJB
    private GameModelManager gmm;


    @EJB
    private GmTypeManager tm;


    @EJB
    private GmUserEventManager uem;


    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<IndexEntry> index(@PathParam("gmID") String gmID,
                                        @PathParam("tID") String tID) {
        GameModel gm = gmm.getGameModel(gmID, null);
        GmType t = tm.getType(gm, tID, null);
        return AlbaHelper.getIndex(t.getUserEvents());
    }


    @GET
    @Path("{eID : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public GmUserEvent get(@PathParam("gmID") String gmID,
                           @PathParam("tID") String tID,
                           @PathParam("eID") String eID) {

        Terminal terminal = dispatcher.getTerminal(request);
        return uem.getUserEvent(gmID, tID, eID, terminal);
    }


    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmUserEvent create(@PathParam("gmID") String gmID,
                              @PathParam("tID") String tID,
                              GmUserEvent userEvent) {

        GameModel gm = gmm.getGameModel(gmID, null);


        GmType type = tm.getType(gm, tID, null);
        userEvent.setBelongsTo(type);

        Terminal term = dispatcher.getTerminal(request);
        uem.createUserEvent(userEvent, term);

        return userEvent;
    }


    @PUT
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{eID : [1-9][0-9]*}")
    public GmUserEvent update(@PathParam("gmID") String gmID,
                              @PathParam("tID") String tID,
                              @PathParam("eID") String eID,
                              GmUserEvent userEvent) {

        Terminal terminal = dispatcher.getTerminal(request);
        return uem.updateUserEvent(gmID, tID, eID, userEvent, terminal);
    }


    /**
     * 
     * propagateDestroy a type and all that depends on
     * 
     * @param gmID
     * @return 
     */
    @DELETE
    @Path("{eID : [1-9][0-9]*}")
    public Response destroy(@PathParam("gmID") String gmID,
                            @PathParam("tID") String tID,
                            @PathParam("eID") String eID) {
        Terminal terminal = dispatcher.getTerminal(request);
        uem.destroyUserEvent(gmID, tID, eID, terminal);
        return Response.ok().build();
    }


}
