
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.rest;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.util.ActAsPlayer;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.ReadableInstance;
import com.wegas.mcq.persistence.Reply;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

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
    @Inject
    private QuestionDescriptorFacade questionDescriptorFacade;
    /**
     *
     */
    @Inject
    private RequestFacade requestFacade;

    @Inject
    private RequestManager requestManager;

    @Inject
    private PlayerFacade playerFacade;

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

        Player player = playerFacade.find(playerId);
        try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
            questionDescriptorFacade.selectAndValidateChoice(choiceId, playerId);
            requestFacade.commit(playerId);
        }

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

        Player player = playerFacade.find(playerId);
        try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
            // !!!!!   CHECK TYPE OF RETURN PARAM   !!!!
            questionDescriptorFacade.validateQuestion(questionInstanceId, playerId);
            requestFacade.commit(playerId);
        }

        return Response.ok().build();
    }

    /**
     *
     * @param playerId
     * @param replyId
     *
     * @return questionInstance with up to date replies list (not containing) the canceled one
     *         anymore)
     */
    @GET
    @Path("/ValidateReply/{replyId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}")
    public QuestionInstance validateReply(
        @PathParam("playerId") Long playerId,
        @PathParam("replyId") Long replyId) {

        Player player = playerFacade.find(playerId);
        try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
            Reply reply = questionDescriptorFacade.validateReply(playerId, replyId);
            requestManager.commit(player);
            return questionDescriptorFacade.getQuestionInstanceFromReply(reply);
        }
    }

    /**
     *
     * @param playerId
     * @param replyId
     *
     * @return questionInstance with up to date replies list (not containing) the cancelled one
     *         anymore)
     */
    @GET
    @Path("/CancelReply/{replyId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}")
    public QuestionInstance cancelReply(
        @PathParam("playerId") Long playerId,
        @PathParam("replyId") Long replyId) {

        Player player = playerFacade.find(playerId);
        try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
            Reply reply = questionDescriptorFacade.cancelReply(playerId, replyId);
            requestFacade.commit(playerId);
            return questionDescriptorFacade.getQuestionInstanceFromReply(reply);
        }
    }

    /**
     *
     * Same as CancelReply, but skip state machine check and do not send any events
     *
     * @param playerId
     * @param replyId
     *
     * @return questionInstance with up to date replies list (not containing) the cancelled one
     *         anymore)
     */
    @GET
    @Path("/QuietCancelReply/{replyId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}")
    public QuestionInstance quietCancelReply(
        @PathParam("playerId") Long playerId,
        @PathParam("replyId") Long replyId) {

        Player player = playerFacade.find(playerId);
        try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
            Reply reply = questionDescriptorFacade.quietCancelReply(playerId, replyId);

            return questionDescriptorFacade.getQuestionInstanceFromReply(reply);
        }
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
        @PathParam("startTime") Long startTime
    ) {

        Player player = playerFacade.find(playerId);
        try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
            Reply reply = questionDescriptorFacade.selectChoice(choiceId, playerId, startTime);

            requestFacade.commit(playerId);

            return questionDescriptorFacade.getQuestionInstanceFromReply(reply);
        }
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
        @PathParam("startTime") Long startTime
    ) {

        Player player = playerFacade.find(playerId);
        try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
            Reply reply = questionDescriptorFacade.deselectOthersAndSelectChoice(choiceId, playerId, startTime);

            //requestFacade.commit(playerId);
            return questionDescriptorFacade.getQuestionInstanceFromReply(reply);
        }
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
    public Reply update(@PathParam("entityId") Long replyId, Reply reply
    ) {

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
        @PathParam("descId") Long id
    ) {
        return questionDescriptorFacade.readQuestion(playerId, id);
    }
}
