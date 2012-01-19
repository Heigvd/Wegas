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

import com.albasim.wegas.ejb.Dispatcher;
import com.albasim.wegas.ejb.GameModelManager;
import com.albasim.wegas.ejb.GmTypeManager;
import com.albasim.wegas.ejb.GmVarDescManager;
import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.persistance.GameModel;
import com.albasim.wegas.persistance.GmType;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistance.GmVariableDescriptor;
import com.albasim.wegas.persistance.type.GmComplexType;

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
@Path("gm/{gmID : [1-9][0-9]*}/type")
public class TypeController {

    private static final Logger logger = Logger.getLogger("Authoring_GM_Type");


    @Context
    HttpServletRequest request;


    @EJB
    Dispatcher dispatcher;


    @EJB
    private GameModelManager gmm;


    @EJB
    private GmTypeManager tm;


    @EJB
    private GmVarDescManager vdm;


    /**
     * Retrieve a game model type index
     * 
     * @param gmID game model id 
     * @return OK
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<IndexEntry> index(@PathParam("gmID") String gmID) {
        GameModel gm = gmm.getGameModel(gmID);
        return AlbaHelper.getIndex(gm.getTypes());
    }


    /**
     * Retrieve a specific game model type
     * @param gmID game model id
     * @return OK
     */
    @GET
    @Path("{tID : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public GmType get(@PathParam("gmID") String gmID,
                      @PathParam("tID") String tID) {
        GameModel gm = gmm.getGameModel(gmID);
        return tm.getType(gm, tID);
    }


    /**
     * 
     * data is: * {
     *   "@class" : "",     # {Boolean,Complex,Double,Enum,wInteger,Media,String,Text} @todo inheritance...
     *   "name" : "...",  # unique within gm, match [a-zA-Z_]+
     *   "userEvents" : ["onAction", "..."] # list of user event that shall be fired by, esp., UI buttons
     *   "methods" : [ {}, {}] @see MethodManager.createMethod 
     *   "..." : "..." # specific parameter, according to "base"
     * }
     * 
     * 
     * @param is
     * @return 
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmType create(@PathParam("gmID") String gmID, GmType theType) {

        GameModel theGameModel = gmm.getGameModel(gmID);
        theType.setGameModel(theGameModel);
        tm.createType(theType);
        return theType;
    }


    /**
     * 
     * @param is
     * @return 
     */
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{cID : [1-9][0-9]*}/var_desc")
    public Collection<IndexEntry> varDescIndex(
            @PathParam("gmID") String gmID,
            @PathParam("cID") String cID) {
        GameModel theGameModel = gmm.getGameModel(gmID);
        GmComplexType complexType = tm.getComplexType(theGameModel, cID);
        return AlbaHelper.getIndex(complexType.getVariableDescriptors());
    }


    /**
     * Create a ComplexType Variable Descriptor
     * @param is
     * @return 
     */
    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{cID : [1-9][0-9]*}/var_desc")
    public GmVariableDescriptor create(@PathParam("gmID") String gmID,
                                       @PathParam("cID") String cID,
                                       GmVariableDescriptor theVarDesc) {
        GameModel theGameModel = gmm.getGameModel(gmID);
        GmComplexType complexType = tm.getComplexType(theGameModel, cID);

        theVarDesc.setParentComplexType(complexType);

        vdm.createVarDesc(theVarDesc);

        return theVarDesc;
    }


    /**
     * propagateUpdate a type 
     * 
     * @param gmID
     * @return 
     */
    @PUT
    @Path("{tID : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmType update(@PathParam("gmID") String gmID,
                         @PathParam("tID") String tID,
                         GmType theType) {

        return tm.updateType(gmID, tID, theType);
    }


    /**
     * 
     * propagateDestroy a type and all that depends on
     * 
     * @param gmID
     * @return 
     */
    @DELETE
    @Path("{tID : [1-9][0-9]*}")
    public Response destroy(@PathParam("gmID") String gmID,
                            @PathParam("tID") String tID) {
        tm.destroyType(gmID, tID);
        return Response.ok().build();
    }


}
