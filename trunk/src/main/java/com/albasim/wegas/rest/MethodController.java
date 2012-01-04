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
import com.albasim.wegas.ejb.GmMethodManager;
import com.albasim.wegas.ejb.GmTypeManager;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistance.GameModel;
import com.albasim.wegas.persistance.GmMethod;
import com.albasim.wegas.persistance.GmType;

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
@Path("gm/{gmID: [1-9][0-9]*}/type/{tID: [1-9][0-9]*}/method")
public class MethodController {

    private static final Logger logger = Logger.getLogger("Authoring_GM_Method");

    @Context HttpServletRequest request;
    
    @EJB Dispatcher dispatcher;

    @EJB
    private GameModelManager gmm;

    @EJB
    private GmTypeManager tm;
    
    @EJB
    private GmMethodManager mm;


    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<IndexEntry> index(@PathParam("gmID") String gmID,
                                      @PathParam("tID") String tID) throws NotFound, InvalidContent {
        GameModel gm = gmm.getGameModel(gmID, null);
        GmType type = tm.getType(gm, tID, null);
        return AlbaHelper.getIndex(type.getMethods());
    }


    /**
     * Retrieve a specific game model
     * @param gmID game model id
     * @return OK
     */
    @GET
    @Path("{mID: [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public GmMethod get(@PathParam("gmID") String gmID,
                        @PathParam("tID") String tID,
                        @PathParam("mID") String mID) {
        Terminal terminal = dispatcher.getTerminal(request);
        GmMethod method = mm.getMethod(gmID, tID, mID, terminal);
        return method;
    }


    /**
     * 
     * @param is
     * @return 
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmMethod create(@PathParam("gmID") String gmID,
                           @PathParam("tID") String tID,
                           GmMethod method) {

        GameModel theGameModel = gmm.getGameModel(gmID, null);
        GmType theType = tm.getType(theGameModel, tID, null);
        method.setBelongsTo(theType);

        Terminal terminal = dispatcher.getTerminal(request);
        mm.createMethod(method, terminal);
        return method;
    }


    /**
     * 
     * @param gmID
     * @return 
     */
    @PUT
    @Path("{mID: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmMethod update(@PathParam("gmID") String gmID,
                           @PathParam("tID") String tID,
                           @PathParam("mID") String mID,
                           GmMethod method) {
        Terminal terminal = dispatcher.getTerminal(request);
        return mm.updateMethod(gmID, tID, mID, method, terminal);
    }


    /**
     * 
     * @param gmID
     * @return 
     */
    @DELETE
    @Path("{mID: [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response destroy(@PathParam("gmID") String gmID,
                            @PathParam("tID") String tID,
                            @PathParam("mID") String mID) {
        Terminal terminal = dispatcher.getTerminal(request);
        mm.destroyMethod(gmID, tID, mID, terminal);
        return Response.noContent().build();
    }


}
