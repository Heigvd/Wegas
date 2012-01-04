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
import com.albasim.wegas.ejb.GmInstanceManager;
import com.albasim.wegas.ejb.GmVarInstManager;
import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistance.GameModel;
import com.albasim.wegas.persistance.GmInstance;
import com.albasim.wegas.persistance.GmVariableInstance;
import java.util.Collection;


import java.util.logging.Level;
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
@Path("gm/{gmID : [1-9][0-9]*}/var")
public class VariableInstanceController {

    private static final Logger logger = Logger.getLogger("Authoring_GM_VariableInstance");


    @EJB
    Dispatcher dispatcher;


    @Context
    HttpServletRequest request;


    @EJB
    private GameModelManager gmm;


    @EJB
    private GmVarInstManager vim;


    @EJB
    private GmInstanceManager im;


    /**
     * Get the list of all variable instances
     * @param gmID
     * @return 
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<IndexEntry> create(
            @PathParam("gmID") String gmID) {
        GameModel theGameModel = gmm.getGameModel(gmID, null);
        return AlbaHelper.getIndex(theGameModel.getVariableInstances());
    }


    /**
     * Retrieve a specific variable and effective instance index
     * @param gmID game model id
     * @param vID  the variable instance id
     * @return OK
     */
    @GET
    @Path("{vID : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public GmVariableInstance get(@PathParam("gmID") String gmID,
                                  @PathParam("vID") String vID) {

        Terminal term = dispatcher.getTerminal(request);
        return vim.getVariableInstance(gmID, vID, term);
    }


    /**
     * Retrieve one of the instance 
     * 
     * @param gmID game model id
     * @param vID  variable id
     * @param iID  instance id
     * @return 
     */
    @GET
    @Path("{vID : [1-9][0-9]*}/{iID : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public GmInstance get(@PathParam("gmID") String gmID,
                          @PathParam("vID") String vID,
                          @PathParam("iID") String iID) {
        Terminal term = dispatcher.getTerminal(request);
        logger.log(Level.INFO, "InstanceCTRL: Terminal is : {0}", term);
        return im.getInstance(gmID, vID, iID, term);
    }


    /**
     * Add an instance to the variable.
     * This operation is prohibited when variable cardinality is not 'Unbounded'.
     * 
     * @param gmID
     * @param vID
     * @param newInstance
     * @return 
     */
    @POST
    @Path("{vID : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmInstance createInstance(@PathParam("gmID") String gmID,
                                     @PathParam("vID") String vID,
                                     GmInstance newInstance) {
        Terminal term = dispatcher.getTerminal(request);
        im.createInstance(gmID, vID, newInstance, term);

        return newInstance;
    }


    /**
     * This operation is prohibited when variable cardinality is not 'Unbounded'.
     * 
     * @param gmID game model id
     * @param vID  variable id
     * @param iID instance id
     * @return 
     */
    @PUT
    @Path("{vID : [1-9][0-9]*}/{iID : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmInstance update(@PathParam("gmID") String gmID,
                             @PathParam("vID") String vID,
                             @PathParam("iID") String iID,
                             GmInstance theInstance) {
        Terminal terminal = dispatcher.getTerminal(request);
        return im.updateInstance(gmID, vID, iID, theInstance, terminal);
    }


    /**
     * This operation is prohibited when variable cardinality is not 'Unbounded'
     * 
     * @param gmID game model id
     * @param vID  variable id
     * @param iID instance id
     * @return 
     */
    @DELETE
    @Path("{vID : [1-9][0-9]*}/{iID : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response destroy(@PathParam("gmID") String gmID,
                            @PathParam("vID") String vID,
                            @PathParam("iID") String iID) {

        Terminal terminal = dispatcher.getTerminal(request);
        im.destroyInstance(gmID, vID, iID, terminal);

        return Response.ok().build();
    }
}