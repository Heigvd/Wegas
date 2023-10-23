
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
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

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
