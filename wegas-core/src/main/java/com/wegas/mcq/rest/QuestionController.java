/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.rest;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.exception.WegasException;
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
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.UnauthorizedException;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/QuestionDescriptor/")
public class QuestionController {

    /**
     *
     */
    @EJB
    private QuestionDescriptorFacade questionDescriptorFacade;
    @EJB
    private RequestFacade requestFacade;
    @EJB
    private UserFacade userFacade;
    @EJB
    private PlayerFacade playerFacade;

    /**
     *
     * @param playerId
     * @param choiceId
     * @return p
     * @throws ScriptException
     * @throws WegasException
     */
    @GET
    @Path("/SelectChoice/{choiceId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response selectChoice(
            @PathParam("playerId") Long playerId,
            @PathParam("choiceId") Long choiceId) throws ScriptException, WegasException {

        checkPermissions(playerFacade.find(playerId).getGame().getId(), playerId);
        
        Reply reply = questionDescriptorFacade.selectChoice(choiceId, playerId, new Long(0));
        //Reply reply =
        //    questionDescriptorFacade.selectChoice(choiceId, requestManager.getPlayer(), new Long(0));

        questionDescriptorFacade.validateReply(playerId, reply.getId());
        requestFacade.commit();
        return Response.ok().build();
    }

    /**
     *
     * @param playerId
     * @param replyId
     * @return
     * @throws ScriptException
     */
    @GET
    @Path("/CancelReply/{replyId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public QuestionInstance cancelReply(
            @PathParam("playerId") Long playerId,
            @PathParam("replyId") Long replyId) throws ScriptException {
        
        checkPermissions(playerFacade.find(playerId).getGame().getId(), playerId);
        
        Reply reply = questionDescriptorFacade.cancelReply(playerId, replyId);
        requestFacade.commit();
        return reply.getQuestionInstance();
    }

    /**
     *
     * @param playerId
     * @param choiceId
     * @param startTime
     * @return p
     * @throws WegasException
     */
    @GET
    @Path("/SelectChoice/{choiceId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}/StartTime/{startTime : [0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public QuestionInstance selectChoice(
            @PathParam("playerId") Long playerId,
            @PathParam("choiceId") Long choiceId,
            @PathParam("startTime") Long startTime) throws WegasException {

        checkPermissions(playerFacade.find(playerId).getGame().getId(), playerId);
        
        Reply reply = questionDescriptorFacade.selectChoice(choiceId, playerId, startTime);
        requestFacade.commit();
        return reply.getQuestionInstance();
    }
    
    private void checkPermissions(Long gameId, Long playerId) throws UnauthorizedException {
        if (!SecurityUtils.getSubject().isPermitted("Game:Edit:g" + gameId) && !userFacade.matchCurrentUser(playerId)) {
            throw new UnauthorizedException();
        }
    }
}
