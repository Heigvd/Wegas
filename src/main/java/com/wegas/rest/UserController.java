/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.rest;

import com.wegas.ejb.UserEntityFacade;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("User")
public class UserController extends AbstractRestController<UserEntityFacade> {

    /**
     *
     */
    @EJB
    private UserEntityFacade userFacade;

    /**
     * 
     * @return
     */
    @Override
    protected UserEntityFacade getFacade() {
        return this.userFacade;
    }
}
