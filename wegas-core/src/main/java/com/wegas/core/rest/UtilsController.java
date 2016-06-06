package com.wegas.core.rest;

import com.wegas.core.ejb.HelperBean;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
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

    @EJB
    private HelperBean helperBean;

    @DELETE
    @Path("EmCache")
    public void wipeEmCache() {
        helperBean.wipeCache();
    }
}
