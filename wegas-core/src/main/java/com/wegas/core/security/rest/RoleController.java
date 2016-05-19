/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.rest.AbstractRestController;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.persistence.Role;
import java.io.IOException;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.authz.annotation.RequiresPermissions;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("Role")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RoleController extends AbstractRestController<RoleFacade, Role> {

    /**
     *
     */
    @EJB
    private RoleFacade roleFacade;

    @Override
    //@Secured                            // fixme Temporarly allowed, should be restricted as soon as "share" widget id refactored
    //@RequiresPermissions("User:Edit")
    public Collection<Role> index() {
        return super.index();
    }

    /**
     * Retrieve a specific game model
     *
     * @param entityId
     * @return OK
     */
    @Override
    @GET
    @Path("{entityId : [1-9][0-9]*}")                                           // @Path annotations are not inherited
    @RequiresPermissions("User:Edit")
    public Role get(@PathParam("entityId") Long entityId) {
        return super.get(entityId);
    }

    /**
     *
     * @param entity
     * @return
     */
    @Override
    @RequiresPermissions("User:Edit")
    public Role create(Role entity) {
        return super.create(entity);
    }

    /**
     *
     * @param entityId
     * @param entity
     * @return
     */
    @Override
    @PUT
    @Path("{entityId : [1-9][0-9]*}")                                           // @Path annotations are not inherited
    @RequiresPermissions("User:Edit")
    public Role update(@PathParam("entityId") Long entityId, Role entity) {
        return super.update(entityId, entity);
    }

    /**
     *
     * @param entityId
     * @return
     * @throws IOException
     */
    @Override
    @POST
    @Path("{entityId : [1-9][0-9]*}/Duplicate")                                 // @Path annotations are not inherited
    @RequiresPermissions("User:Edit")
    public Role duplicate(@PathParam("entityId") Long entityId) throws IOException {
        throw new NoSuchMethodError("Role duplication not implemented");
    }

    /**
     *
     * @param entityId
     * @return
     */
    @Override
    @DELETE
    @Path("{entityId : [1-9][0-9]*}")                                           // @Path annotations are not inherited
    @RequiresPermissions("User:Edit")
    public Role delete(@PathParam("entityId") Long entityId) {
        return super.delete(entityId);
    }

    /**
     *
     * @return
     */
    @Override
    protected RoleFacade getFacade() {
        return this.roleFacade;
    }
}
