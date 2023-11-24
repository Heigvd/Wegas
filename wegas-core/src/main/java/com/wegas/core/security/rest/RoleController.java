/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.rest.AbstractRestController;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import java.util.List;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.apache.shiro.authz.annotation.RequiresRoles;

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
    @Inject
    private RoleFacade roleFacade;

    /**
     * Retrieve a specific game model
     *
     * @param entityId role id
     *
     * @return the role matching entityId
     */
    @Override
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    @RequiresPermissions("User:Edit")
    public Role get(@PathParam("entityId") Long entityId) {
        return super.get(entityId);
    }

    /**
     * Create a new role
     *
     * @param entity role to create
     *
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
     *
     * @return up to date role or HTTP Forbidden status if user is not an admin
     */
    @Override
    @PUT
    @Path("{entityId : [1-9][0-9]*}")
    @RequiresPermissions("User:Edit")
    public Role update(@PathParam("entityId") Long entityId, Role entity) {
        return super.update(entityId, entity);
    }

    /**
     * copy a role
     *
     * @param entityId
     *
     * @return role copy or HTTP Forbidden status if user is not an admin
     */
    @Override
    @POST
    @Path("{entityId : [1-9][0-9]*}/Duplicate")
    @RequiresPermissions("User:Edit")
    public Role duplicate(@PathParam("entityId") Long entityId) {
        throw new NoSuchMethodError("Role duplication not implemented");
    }

    /**
     * Delete a role
     *
     * @param entityId
     *
     * @return just deleted role or HTTP Forbidden status if user is not an admin
     */
    @Override
    @DELETE
    @Path("{entityId : [1-9][0-9]*}")
    @RequiresPermissions("User:Edit")
    public Role delete(@PathParam("entityId") Long entityId) {
        return super.delete(entityId);
    }

    @POST
    @RequiresRoles("Administrator")
    @Path("Permission/{roleId : [1-9][0-9]*}")
    public Permission createPermission(@PathParam("roleId") Long roleId, Permission permission) {
        return roleFacade.createPermission(roleId, permission);
    }

    /**
     * Grant given permission to the given role to the specified gameModel. Previous role
     * permissions to gameModel will be revoked
     *
     * @param gameModelId id of the gameModel
     * @param permission  (View|Edit|Delete|Duplicate|Instantiate), comma separated
     * @param accountId   user accountId
     */
    @POST
    @Path("ShareGameModel/{gameModelId : [1-9][0-9]*}/{permission: (View|Edit|Delete|Duplicate|Instantiate|Translate-[A-Z]*|,)*}/{roleId : [1-9][0-9]*}")
    public Permission shareGameModel(@PathParam("gameModelId") Long gameModelId,
        @PathParam("permission") String permission,
        @PathParam("roleId") Long roleId) {

        return roleFacade.grantGameModelPermission(roleId, permission, gameModelId);
    }

    @DELETE
    @Path("ShareGameModel/{gameModelId : [1-9][0-9]*}/{roleId : [1-9][0-9]*}")
    public List<Permission> unshareGameModelRole(@PathParam("gameModelId") Long gameModelId,
        @PathParam("roleId") Long roleId) {

        return roleFacade.revokeGameModelPermissions(gameModelId, roleId);
    }

    /**
     * Grant given permission to the given role to the specified game. Previous role permissions to
     * game will be revoked
     *
     * @param gameId     id of the game
     * @param permission (View|Edit|Delete|Duplicate|Instantiate), comma separated
     * @param accountId  user accountId
     */
    @POST
    @Path("ShareGame/{gameId : [1-9][0-9]*}/{roleId : [1-9][0-9]*}")
    public Permission shareGame(@PathParam("gameId") Long gameId,
        @PathParam("permission") String permission,
        @PathParam("roleId") Long roleId) {

        return roleFacade.grantGamePermission(roleId, gameId);
    }

    @DELETE
    @Path("ShareGame/{gameId : [1-9][0-9]*}/{roleId : [1-9][0-9]*}")
    public List<Permission> unshareGameRole(@PathParam("gameId") Long gameId,
        @PathParam("roleId") Long roleId) {

        return roleFacade.revokeGamePermissions(gameId, roleId);
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
