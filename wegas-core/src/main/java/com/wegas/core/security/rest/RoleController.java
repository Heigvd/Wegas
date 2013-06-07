/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.rest.AbstractRestController;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.util.Secured;
import java.io.IOException;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import org.apache.shiro.authz.annotation.RequiresPermissions;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("Role")
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
    @Secured
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
    @Secured
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
    @Secured
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
    @Secured
    @RequiresPermissions("User:Edit")
    public Role duplicate(@PathParam("entityId") Long entityId) throws IOException {
        return super.duplicate(entityId);
    }

    /**
     *
     * @param entityId
     * @return
     */
    @Override
    @Secured
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
