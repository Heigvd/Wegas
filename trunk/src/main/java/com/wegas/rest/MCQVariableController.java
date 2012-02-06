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

import com.wegas.ejb.MCQVariableManager;
import com.wegas.persistence.variabledescriptor.MCQVariableDescriptorReplyEntity;
import com.wegas.script.ScriptEntity;
import com.wegas.script.ScriptManager;



import javax.ejb.EJB;
import javax.ejb.Stateless;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("gm/{gameModelId : [1-9][0-9]*}/mcqvariable/")
public class MCQVariableController {

    @EJB
    private ScriptManager sm;
    @EJB
    private MCQVariableManager mcqvm;

    /**
     * 
     * @param gameModelId 
     * @param playerId 
     * @param replyId 
     * @return p
     */
    @GET
    @Path("/player/{playerId : [1-9][0-9]*}/reply/{replyId : [1-9][0-9]*}/runscript/")
    @Produces(MediaType.APPLICATION_JSON)
    public Response runScript(@PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId, @PathParam("replyId") Long replyId) {
        MCQVariableDescriptorReplyEntity reply = mcqvm.getMCQReply(replyId);
        System.out.println(reply.getImpact());
        ScriptEntity s = new ScriptEntity();
        s.setContent(reply.getImpact());
        sm.runScript(1l, 1l, s);
        return Response.status(Response.Status.OK).build();
    }
}
