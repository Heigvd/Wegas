/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.rest;

import com.wegas.core.rest.AbstractRestController;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.persistence.Role;
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
