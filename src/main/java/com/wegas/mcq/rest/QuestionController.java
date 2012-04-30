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

import com.wegas.core.persistence.variable.VariableInstanceEntity;
import com.wegas.core.rest.AbstractRestController;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.persistence.QuestionInstanceEntity;
import com.wegas.mcq.persistence.ReplyEntity;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.script.ScriptException;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

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
    private QuestionDescriptorFacade choiceDescriptorFacade;

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param replyId
     * @return p
     */
    @GET
    @Path("/SelectReply/{replyId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public List<VariableInstanceEntity> selectReply(
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId,
            @PathParam("replyId") Long replyId) throws ScriptException {

        ReplyEntity reply =
                choiceDescriptorFacade.selectChoice(replyId, playerId, new Long(0));
        return choiceDescriptorFacade.validateReply(playerId,reply.getId());
    }

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param replyDescriptorId
     * @param startTime
     * @return p
     */
    @GET
    @Path("/SelectReply/{replyDescriptorId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}/StartTime/{startTime : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public QuestionInstanceEntity selectReply(
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId,
            @PathParam("replyDescriptorId") Long replyDescriptorId,
            @PathParam("startTime") Long startTime) {

        ReplyEntity reply =
                choiceDescriptorFacade.selectChoice(replyDescriptorId, playerId, startTime);
        return reply.getQuestionInstance();
    }

    /**
     *
     * @return
     */
    @Override
    protected QuestionDescriptorFacade getFacade() {
        return this.choiceDescriptorFacade;
    }
}
