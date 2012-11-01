/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.security.ejb.UserFacade;
import java.util.Collection;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("RegisteredGames")
public class RegisteredGameController {

    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    @GET
    @Path("/{userId : [1-9][0-9]*}/")
    @Produces(MediaType.APPLICATION_JSON)
    public Collection<AbstractEntity> index(@PathParam("userId") Long userId) {
        return (Collection) userFacade.registeredGames(userId);
    }
}
