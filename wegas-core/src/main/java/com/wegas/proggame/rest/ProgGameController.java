
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.proggame.rest;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.security.util.ScriptExecutionContext;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/ProgGame/")
public class ProgGameController {

    /**
     *
     */
    @Inject
    private ScriptFacade scriptFacade;

    @Inject
    private RequestManager requestManager;

    /**
     *
     * @param playerId
     * @param script
     *
     * @return whatever the script returns
     */
    @POST
    @Path("/Run/{playerId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public Object run(
        @PathParam("playerId") Long playerId, String script) throws WegasScriptException {

        try (ScriptExecutionContext ctx = requestManager.switchToExternalExecContext(true)) {
            return scriptFacade.timeoutEval(playerId, new Script("JavaScript", script));
        }
    }
}
