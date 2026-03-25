package com.wegas.announcement.rest;

import com.wegas.announcement.ejb.AnnouncementFacade;
import com.wegas.announcement.persistence.Announcement;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import org.apache.shiro.authz.annotation.RequiresRoles;

import java.util.List;

@Stateless
@Path("Announcement")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AnnouncementController {

    @Inject
    private AnnouncementFacade announcementFacade;

    @POST
    @RequiresRoles("Administrator")
    @Path("create")
    public Announcement create(Announcement announcement){
        return announcementFacade.createNew(announcement);
    }

    @PUT
    @RequiresRoles("Administrator")
    @Path("{id: [1-9][0-9]*}")
    public Announcement update(@PathParam("id") Long entityId, Announcement entity) {
        return announcementFacade.update(entityId, entity);
    }

    @DELETE
    @RequiresRoles("Administrator")
    @Path("{id: [1-9][0-9]*}")
    public void delete(@PathParam("id") Long id) {
        announcementFacade.remove(id);
    }

    @GET
    @RequiresRoles("Administrator")
    @Path("all")
    public List<Announcement> getAll() {
        return announcementFacade.findAll();
    }

    @GET
    @Path("active")
    public List<Announcement> getActive() {
       return announcementFacade.findActive();
    }

}
