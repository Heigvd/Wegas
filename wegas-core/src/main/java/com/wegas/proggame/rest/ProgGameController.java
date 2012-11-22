/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.proggame.rest;

import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.persistence.game.Script;
import com.wegas.exception.WegasException;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.script.ScriptException;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/ProgGame/")
public class ProgGameController {

    /**
     *
     */
    @EJB
    private ScriptFacade scriptFacade;

    @POST
    @Path("/Run/Player/{playerId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object run(
            @PathParam("playerId") Long playerId, String script) throws ScriptException, WegasException {

        return scriptFacade.eval(playerId, new Script("JavaScript", script));
    }
}
