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

import com.wegas.core.persistence.variable.VariableInstanceEntity;
import com.wegas.core.script.ScriptEntity;
import com.wegas.core.script.ScriptManager;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
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
    /*
     *
     */
    @EJB
    private ScriptManager scriptManager;

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param script 
     * @return p
     */
    @POST
    @Path("/Run/Player/{playerId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public List<VariableInstanceEntity> selectReply(
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId, ScriptEntity script) {
        return scriptManager.runScript(gameModelId, playerId, script);
    }
}
