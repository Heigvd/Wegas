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
import com.albasim.wegas.ejb.GameModelManager;
import com.albasim.wegas.ejb.GmEnumItemManager;
import com.albasim.wegas.ejb.GmTypeManager;
import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistence.GameModel;
import com.albasim.wegas.persistence.GmEnumItem;
import com.albasim.wegas.persistence.type.GmEnumType;
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
@Path("gm/{gmID : [1-9][0-9]*}/type/{eID : [1-9][0-9]*}/item")
public class EnumItemController {

    private static final Logger logger = Logger.getLogger("Authoring_GM_EnumItem");


    @Context
    private HttpServletRequest request;


    @EJB
    private Dispatcher dispatcher;


    @EJB
    private GmEnumItemManager amm;


    @EJB
    private GameModelManager gmm;


    @EJB
    private GmTypeManager tm;


    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<IndexEntry> index(@PathParam("gmID") String gmID,
                                        @PathParam("eID") String eID) {

        logger.log(Level.INFO, "Get enum Item lists");
        GameModel gm = gmm.getGameModel(gmID);
        GmEnumType enumType = tm.getEnumType(gm, eID);
        return AlbaHelper.getIndex(enumType.getItems());
    }


    @GET
    @Path("{itID : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public GmEnumItem get(@PathParam("gmID") String gmID,
                          @PathParam("eID") String eID,
                          @PathParam("itID") String itID) {
//        Terminal terminal = dispatcher.getTerminal(request);
        return amm.getEnumItem(gmID, eID, itID);
    }


    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmEnumItem createItem(@PathParam("gmID") String gmID,
                                 @PathParam("eID") String eID,
                                 GmEnumItem item) {

        GameModel gm = gmm.getGameModel(gmID);
        GmEnumType enumType = tm.getEnumType(gm, eID);
        item.setGmEnumType(enumType);

        amm.createEnumItem(item);

        return item;
    }


    @PUT
    @Path("{itID : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmEnumItem updateItem(@PathParam("gmID") String gmID,
                                 @PathParam("eID") String eID,
                                 @PathParam("itID") String itID,
                                 GmEnumItem newItem) {
        return amm.updateEnumItem(gmID, eID, itID, newItem);
    }


    @DELETE
    @Path("{itID : [1-9][0-9]*}")
    public Response destroyItem(@PathParam("gmID") String gmID,
                                @PathParam("eID") String eID,
                                @PathParam("itID") String itID) {
        amm.destroyEnumItem(gmID, eID, itID);
        return Response.ok().build();
    }


}
