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
import com.albasim.wegas.ejb.GmEventListenerManager;
import com.albasim.wegas.ejb.GmInstanceManager;
import com.albasim.wegas.helper.AlbaHelper;
import com.albasim.wegas.helper.IndexEntry;
import com.albasim.wegas.persistance.GmEventListener;
import com.albasim.wegas.persistance.instance.GmComplexInstance;
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
@Path("gm/{gmID : [1-9][0-9]*}/var/{viID : [1-9][0-9]*}/{ciID : [1-9][0-9]*}/event")
public class EventListenerController {

    private static final Logger logger = Logger.getLogger("Authoring_GM_EventListener");


    @Context
    HttpServletRequest request;


    @EJB
    private Dispatcher dispatcher;


    @EJB
    private GmEventListenerManager elm;


    @EJB
    private GmInstanceManager vim;


    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<IndexEntry> index(@PathParam("gmID") String gmID,
                                        @PathParam("viID") String viID,
                                        @PathParam("ciID") String ciID) {

        GmComplexInstance ci = vim.getComplexInstance(gmID, viID, ciID);
        return AlbaHelper.getIndex(ci.getListeners());
    }


    @GET
    @Path("{elID : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public GmEventListener get(@PathParam("gmID") String gmID,
                               @PathParam("viID") String viID,
                               @PathParam("ciID") String ciID,
                               @PathParam("elID") String elID) {
        Terminal terminal = dispatcher.getTerminal(request);
        GmEventListener eventListener = elm.getEventListener(gmID, viID, ciID, elID, terminal);

        return eventListener;
    }


    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmEventListener createItem(@PathParam("gmID") String gmID,
                                      @PathParam("viID") String viID,
                                      @PathParam("ciID") String ciID,
                                      GmEventListener listener) {

        Terminal terminal = dispatcher.getTerminal(request);
        elm.createEventListener(gmID, viID, ciID, listener, terminal);

        return listener;
    }


    @PUT
    @Path("{elID : [1-9][0-9]*}")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public GmEventListener updateItem(@PathParam("gmID") String gmID,
                                      @PathParam("viID") String viID,
                                      @PathParam("ciID") String ciID,
                                      @PathParam("elID") String elID,
                                      GmEventListener listener) {

        Terminal terminal = dispatcher.getTerminal(request);
        return elm.updateEventListener(gmID, viID, ciID, elID, listener, terminal);
    }


    @DELETE
    @Path("{elID : [1-9][0-9]*}")
    public Response destroyItem(@PathParam("gmID") String gmID,
                                @PathParam("viID") String viID,
                                @PathParam("ciID") String ciID,
                                @PathParam("elID") String elID) {

        Terminal terminal = dispatcher.getTerminal(request);
        elm.destroyEventListener(gmID, viID, ciID, elID, terminal);

        return Response.ok().build();
    }
}
