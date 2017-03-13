package com.wegas.core.rest;

import com.wegas.core.Helper;
import com.wegas.core.ejb.HelperBean;
import fish.payara.micro.cdi.Outbound;

import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 * @author CiGit
 */
@Stateless
@Path("Utils")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class UtilsController {

    @Inject
    @Outbound(eventName = HelperBean.CLEAR_CACHE_EVENT_NAME, loopBack = true)
    Event<String> messages;

    @DELETE
    @Path("EmCache")
    public void wipeEmCache() {
        messages.fire("clear");
    }

    @GET
    @Path("version")
    public String getVersion() {
        return Helper.getWegasProperty("wegas.build.version", "unknown");
    }

    @GET
    @Path("build_number")
    public String getBuildNumber() {
        return Helper.getWegasProperty("wegas.build.number", "unknown");
    }
}
