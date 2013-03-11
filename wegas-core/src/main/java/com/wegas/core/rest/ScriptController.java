/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.security.ejb.UserFacade;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.script.ScriptException;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.UnauthorizedException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Script/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class ScriptController {

    /**
     *
     */
    @EJB
    private ScriptFacade scriptManager;
    @EJB
    private UserFacade userFacade;
    @EJB
    private RequestFacade requestFacade;

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param script
     * @return p
     * @throws ScriptException
     * @throws WegasException
     */
    @POST
    @Path("Run/{playerId : [1-9][0-9]*}")
    public Object run(@PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId, Script script)
            throws ScriptException, WegasException {

        if (SecurityUtils.getSubject().isPermitted("GameModel:Edit:gm" + gameModelId)
                || userFacade.matchCurrentUser(playerId)) {
            Object r = scriptManager.eval(playerId, script);
            requestFacade.commit();
            return r;
        } else {
            throw new UnauthorizedException();

        }
    }
}
