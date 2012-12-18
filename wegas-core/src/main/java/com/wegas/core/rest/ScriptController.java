/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.RequestManagerFacade;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.persistence.game.Script;
import com.wegas.exception.WegasException;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.script.ScriptException;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/Script/")
public class ScriptController {

    /**
     *
     */
    @EJB
    private ScriptFacade scriptManager;
    /**
     *
     */
    @EJB
    private RequestManagerFacade requestManagerFacade;

    /**
     *
     * @param playerId
     * @param script
     * @return p
     * @throws ScriptException
     */
    @POST
    @Path("/Run/Player/{playerId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object run(
            @PathParam("playerId") Long playerId, Script script)
            throws ScriptException, WegasException {
        Object r = scriptManager.eval(playerId, script);
        requestManagerFacade.commit();
        return r;
    }
}
