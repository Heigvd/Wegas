/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.albasim.wegas.rest;

import com.albasim.wegas.ejb.Dispatcher;
import com.albasim.wegas.ejb.GmMethodManager;
import com.albasim.wegas.ejb.GmParameterManager;
import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.exception.NotFound;
import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistence.GmMethod;
import com.albasim.wegas.persistence.GmParameter;

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
@Path("gm/{gmID: [1-9][0-9]*}/type/{tID: [1-9][0-9]*}/method/{mID : [1-9][0-9]*}/param")
public class ParameterController {

    private static final Logger logger = Logger.getLogger("Authoring_GM_Parameter");


    @Context
    HttpServletRequest request;


    @EJB
    Dispatcher dispatcher;


    @EJB
    private GmParameterManager pm;


    @EJB
    private GmMethodManager mm;


    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<IndexEntry> index(@PathParam("gmID") String gmID,
                                        @PathParam("tID") String tID,
                                        @PathParam("mID") String mID) throws NotFound, InvalidContent {
        GmMethod method = mm.getMethod(gmID, tID, mID);
        return AlbaHelper.getIndex(method.getParameters());
    }


    /**
     * Retrieve a specific game model
     * @param gmID game model id
     * @return OK
     */
    @GET
    @Path("{pID : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public GmParameter get(@PathParam("gmID") String gmID,
                           @PathParam("tID") String tID,
                           @PathParam("mID") String mID,
                           @PathParam("pID") String pID) throws InvalidContent, NotFound {
        return pm.getParameter(gmID, tID, mID, pID);
    }


    /**
     * 
     * @param is
     * @return 
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmParameter create(@PathParam("gmID") String gmID,
                              @PathParam("tID") String tID,
                              @PathParam("mID") String mID,
                              GmParameter param) throws NotFound, InvalidContent {
        GmMethod method = mm.getMethod(gmID, tID, mID);
        param.setMethod(method);
        pm.createParameter(param);
        return param;
    }


    /**
     * 
     * @param gmID
     * @return 
     */
    @PUT
    @Path("{pID : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmParameter update(@PathParam("gmID") String gmID,
                              @PathParam("tID") String tID,
                              @PathParam("mID") String mID,
                              @PathParam("pID") String pID,
                              GmParameter parameter) throws NotFound, InvalidContent {

        return pm.updateParameter(gmID, tID, mID, pID, parameter);
    }


    /**
     * 
     * @param gmID
     * @return 
     */
    @DELETE
    @Path("{pID : [1-9][0-9]*}")
    public Response destroy(@PathParam("gmID") String gmID,
                            @PathParam("tID") String tID,
                            @PathParam("mID") String mID,
                            @PathParam("pID") String pID) throws InvalidContent, NotFound {
        pm.destroyParameter(gmID, tID, mID, pID);
        return Response.ok().build();
    }


}
