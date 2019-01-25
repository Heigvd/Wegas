/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.rest;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.Reply;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import com.wegas.mcq.persistence.ReadableInstance;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/QuestionDescriptor/")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class QuestionController {

    /**
     *
     */
    @EJB
    private QuestionDescriptorFacade questionDescriptorFacade;
    /**
     *
     */
    @EJB
    private RequestFacade requestFacade;

    /**
     *
     * @param playerId
     * @param choiceId
     *
     * @return p
     *
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    @POST
    @Path("/SelectAndValidateChoice/{choiceId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}")
    public Response selectAnValidateChoice(
            @PathParam("playerId") Long playerId,
            @PathParam("choiceId") Long choiceId) throws WegasScriptException {

        questionDescriptorFacade.selectAndValidateChoice(choiceId, playerId);
        requestFacade.commit(playerId);

        return Response.ok().build();
    }

    /**
     *
     * @param questionInstanceId
     * @param playerId
     *
     * @return p
     *
     * @throws com.wegas.core.exception.client.WegasScriptException
     */
    @POST
    @Path("/ValidateQuestion/{questionInstanceId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}")
    public Response validateQuestion(
            @PathParam("questionInstanceId") Long questionInstanceId,
            @PathParam("playerId") Long playerId) throws WegasScriptException {

        // !!!!!   CHECK TYPE OF RETURN PARAM   !!!!
        questionDescriptorFacade.validateQuestion(questionInstanceId, playerId);
        requestFacade.commit(playerId);

        return Response.ok().build();
    }

    /**
     *
     * @param playerId
     * @param replyId
     *
     * @return questionInstance with up to date replies list (not containing)
     *         the canceled one anymore)
     */
    @GET
    @Path("/ValidateReply/{replyId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}")
    public QuestionInstance validateReply(
            @PathParam("playerId") Long playerId,
            @PathParam("replyId") Long replyId) {

        Reply reply = questionDescriptorFacade.validateReply(playerId, replyId);
        requestFacade.commit(playerId);
        return questionDescriptorFacade.getQuestionInstanceFromReply(reply);
    }

    /**
     *
     * @param playerId
     * @param replyId
     *
     * @return questionInstance with up to date replies list (not containing)
     *         the canceled one anymore)
     */
    @GET
    @Path("/CancelReply/{replyId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}")
    public QuestionInstance cancelReply(
            @PathParam("playerId") Long playerId,
            @PathParam("replyId") Long replyId) {

        Reply reply = questionDescriptorFacade.cancelReply(playerId, replyId);
        requestFacade.commit(playerId);
        return questionDescriptorFacade.getQuestionInstanceFromReply(reply);
    }

    /**
     *
     * @param playerId
     * @param choiceId
     * @param startTime
     *
     * @return p
     */
    @GET
    @Path("/SelectChoice/{choiceId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}/StartTime/{startTime : [0-9]*}")
    public QuestionInstance selectChoice(
            @PathParam("playerId") Long playerId,
            @PathParam("choiceId") Long choiceId,
            @PathParam("startTime") Long startTime) {

        Reply reply = questionDescriptorFacade.selectChoice(choiceId, playerId, startTime);

        requestFacade.commit(playerId);

        return questionDescriptorFacade.getQuestionInstanceFromReply(reply);
    }

    /**
     *
     * @param playerId
     * @param choiceId
     * @param startTime
     *
     * @return p
     */
    @GET
    @Path("/DeselectOthersAndSelectChoice/{choiceId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}/StartTime/{startTime : [0-9]*}")
    public QuestionInstance deselectOthersAndselectChoice(
            @PathParam("playerId") Long playerId,
            @PathParam("choiceId") Long choiceId,
            @PathParam("startTime") Long startTime) {

        Reply reply = questionDescriptorFacade.deselectOthersAndSelectChoice(choiceId, playerId, startTime);

        //requestFacade.commit(playerId);

        return questionDescriptorFacade.getQuestionInstanceFromReply(reply);
    }

    /**
     *
     * @param replyId
     * @param reply
     *
     * @return updated reply
     */
    @PUT
    @Path("Reply/{entityId: [1-9][0-9]*}")
    public Reply update(@PathParam("entityId") Long replyId, Reply reply) {

        //SecurityUtils.getSubject().checkPermission("Game:Edit:g" + VariableInstanceFacade.findGame(entityId).getId());
        return questionDescriptorFacade.updateReply(replyId, reply);
    }

    /**
     * Mark a question, openQuestion or choice instance as read
     *
     * @param playerId the reader
     * @param id       id of the descriptor
     *
     * @return
     */
    @PUT
    @Path("Read/{playerId : [1-9][0-9]*}/{descId: [1-9][0-9]*}")
    public ReadableInstance readQuestion(
            @PathParam("playerId") Long playerId,
            @PathParam("descId") Long id) {
        return questionDescriptorFacade.readQuestion(playerId, id);
    }
}
