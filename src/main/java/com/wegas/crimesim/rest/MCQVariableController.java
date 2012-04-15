/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.crimesim.rest;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import com.wegas.core.rest.AbstractRestController;
import com.wegas.core.script.ScriptManager;
import com.wegas.crimesim.ejb.MCQReplyDescriptorFacade;
import com.wegas.crimesim.ejb.MCQDescriptorFacade;
import com.wegas.crimesim.persistence.variable.MCQReplyInstanceEntity;
import com.wegas.crimesim.persistence.variable.MCQInstanceEntity;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
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
@Path("GameModel/{gameModelId : [1-9][0-9]*}/VariableDescriptor/MCQVariable/")
public class MCQVariableController extends AbstractRestController<MCQDescriptorFacade> {
    /*
     *
     */

    @EJB
    private MCQDescriptorFacade mCQVariableDescriptorFacade;
    /**
     *
     */
    @EJB
    private MCQReplyDescriptorFacade mCQReplyDescriptorFacade;

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
            @PathParam("replyId") Long replyId) {

        MCQReplyInstanceEntity replyInstance =
                mCQReplyDescriptorFacade.selectReply(replyId, playerId, new Long(0));
        return mCQReplyDescriptorFacade.validateReply(replyInstance.getId(), playerId);
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
    public MCQInstanceEntity selectReply(
            @PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId,
            @PathParam("replyDescriptorId") Long replyDescriptorId,
            @PathParam("startTime") Long startTime) {

        MCQReplyInstanceEntity replyInstance =
                mCQReplyDescriptorFacade.selectReply(replyDescriptorId, playerId, startTime);
        return replyInstance.getMCQVariableInstance();
    }

    /**
     *
     * @return
     */
    @Override
    protected MCQDescriptorFacade getFacade() {
        return this.mCQVariableDescriptorFacade;
    }
}
