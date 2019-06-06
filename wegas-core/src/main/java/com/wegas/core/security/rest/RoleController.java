/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.rest.AbstractRestController;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.persistence.Role;
import java.util.Collection;
import javax.inject.Inject;
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
@Path("Role")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class RoleController extends AbstractRestController<RoleFacade, Role> {

    /**
     *
     */
    @Inject
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
     * @param entityId role id
     * @return the role matching entityId
     */
    @Override
    @GET
    @Path("{entityId : [1-9][0-9]*}")                                           // @Path annotations are not inherited
    @RequiresPermissions("User:Edit")
    public Role get(@PathParam("entityId") Long entityId) {
        return super.get(entityId);
    }

    /**
     * Create a new role
     *
     * @param entity role to create
     * @return the new role or HTTP Forbidden status if user is not an admin
     */
    @Override
    @RequiresPermissions("User:Edit")
    public Role create(Role entity) {
        return super.create(entity);
    }

    /**
     * Update a role
     *
     * @param entityId if of role to update
     * @param entity   role to read new values from
     * @return up to date role or HTTP Forbidden status if user is not an admin
     */
    @Override
    @PUT
    @Path("{entityId : [1-9][0-9]*}")                                           // @Path annotations are not inherited
    @RequiresPermissions("User:Edit")
    public Role update(@PathParam("entityId") Long entityId, Role entity) {
        return super.update(entityId, entity);
    }

    /**
     * copy a role
     *
     * @param entityId
     * @return role copy or HTTP Forbidden status if user is not an admin
     */
    @Override
    @POST
    @Path("{entityId : [1-9][0-9]*}/Duplicate")                                 // @Path annotations are not inherited
    @RequiresPermissions("User:Edit")
    public Role duplicate(@PathParam("entityId") Long entityId) {
        throw new NoSuchMethodError("Role duplication not implemented");
    }

    /**
     * Delete a role
     *
     * @param entityId
     * @return just deleted role or HTTP Forbidden status if user is not an
     *         admin
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
     * @return the roleFacade
     */
    @Override
    protected RoleFacade getFacade() {
        return this.roleFacade;
    }
}
