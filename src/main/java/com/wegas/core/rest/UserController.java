/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.core.ejb.UserFacade;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("User")
public class UserController extends AbstractRestController<UserFacade> {

    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    /**
     *
     * @return
     */
    @Override
    protected AbstractFacade getFacade() {
        return this.userFacade;
    }
}
