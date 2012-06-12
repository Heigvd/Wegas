/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.mcq.rest;

import com.wegas.core.rest.AbstractRestController;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.Reply;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.script.ScriptException;
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
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/QuestionDescriptor/")
public class QuestionController extends AbstractRestController<QuestionDescriptorFacade> {

    /**
     *
     */
    @EJB
    private QuestionDescriptorFacade questionDescriptorFacade;

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param choiceId
     * @return p
     * @throws ScriptException
     */
    @GET
    @Path("/SelectReply/{choiceId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response selectReply(
            @PathParam("playerId") Long playerId,
            @PathParam("choiceId") Long choiceId) throws ScriptException {

        Reply reply =
                questionDescriptorFacade.selectChoice(choiceId, playerId, new Long(0));
        questionDescriptorFacade.validateReply(playerId, reply.getId());
        return Response.ok().build();
    }

    /**
     *
     * @param gameModelId
     * @param replyId
     * @return
     * @throws ScriptException
     */
    @GET
    @Path("/CancelReply/{replyId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public QuestionInstance cancelReply(
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("replyId") Long replyId) throws ScriptException {
        Reply reply = questionDescriptorFacade.cancelReply(replyId);
        return reply.getQuestionInstance();
    }

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param choiceDescriptorId
     * @param startTime
     * @return p
     */
    @GET
    @Path("/SelectReply/{choiceDescriptorId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}/StartTime/{startTime : [0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public QuestionInstance selectReply(
            @PathParam("playerId") Long playerId,
            @PathParam("choiceDescriptorId") Long choiceDescriptorId,
            @PathParam("startTime") Long startTime) {

        Reply reply = questionDescriptorFacade.selectChoice(choiceDescriptorId, playerId, startTime);
        return reply.getQuestionInstance();
    }

    /**
     *
     * @return
     */
    @Override
    protected QuestionDescriptorFacade getFacade() {
        return this.questionDescriptorFacade;
    }
}
