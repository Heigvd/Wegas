/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.rest.AbstractRestController;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.util.Secured;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;
import org.apache.shiro.authz.annotation.RequiresPermissions;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("Role")
@Secured
@RequiresPermissions("User:Edit")
public class RoleController extends AbstractRestController<RoleFacade, Role> {

    /**
     *
     */
    @EJB
    private RoleFacade roleFacade;

    /**
     *
     * @return
     */
    @Override
    protected RoleFacade getFacade() {
        return this.roleFacade;
    }
}
