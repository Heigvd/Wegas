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

import com.wegas.crimesim.ejb.MCQVariableDescriptorEntityFacade;
import com.wegas.crimesim.ejb.MCQVariableDescriptorReplyEntityFacade;
import com.wegas.core.ejb.PlayerEntityFacade;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.crimesim.persistence.variable.MCQVariableDescriptorReplyEntity;
import com.wegas.core.persistence.variabledescriptor.VariableDescriptorEntity;
import com.wegas.crimesim.persistence.variable.MCQVariableInstanceEntity;
import com.wegas.crimesim.persistence.variable.MCQVariableInstanceReplyEntity;
import com.wegas.core.persistence.variableinstance.VariableInstanceEntity;
import com.wegas.core.rest.AbstractRestController;
import com.wegas.core.script.ScriptEntity;
import com.wegas.core.script.ScriptManager;
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
public class MCQVariableController extends AbstractRestController<MCQVariableDescriptorEntityFacade> {
    /*
     *
     */

    @EJB
    private MCQVariableDescriptorEntityFacade mCQVariableDescriptorFacade;
    /**
     *
     */
    @EJB
    private MCQVariableDescriptorReplyEntityFacade mCQVariableDescriptorReplyFacade;
    /**
     *
     */
    @EJB
    private ScriptManager sm;
    /**
     *
     */
    @EJB
    private PlayerEntityFacade playerEntityFacade;

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
    public List<VariableInstanceEntity> selectReply(@PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId, @PathParam("replyId") Long replyId) {
        return this.selectReply(gameModelId, playerId, replyId, new Long(0));
    }

    /**
     *
     * @param gameModelId
     * @param playerId
     * @param replyId
     * @return p
     */
    @GET
    @Path("/SelectReply/{replyId : [1-9][0-9]*}/Player/{playerId : [1-9][0-9]*}/StartTime/{startTime : [1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    public List<VariableInstanceEntity> selectReply(@PathParam("gameModelId") Long gameModelId,
            @PathParam("playerId") Long playerId, @PathParam("replyId") Long replyId, @PathParam("startTime") Long startTime) {
        MCQVariableDescriptorReplyEntity reply = mCQVariableDescriptorReplyFacade.find(replyId);
        PlayerEntity player = playerEntityFacade.find(playerId);

        VariableDescriptorEntity vd = reply.getMCQVariableDescriptor();
        MCQVariableInstanceEntity vi = (MCQVariableInstanceEntity) vd.getVariableInstance(player);

        MCQVariableInstanceReplyEntity replyInstance = new MCQVariableInstanceReplyEntity();
        replyInstance.setAnswer(reply.getAnswer());
        replyInstance.setDescription(reply.getDescription());
        replyInstance.setName(reply.getName());
        replyInstance.setStartTime(startTime);
        replyInstance.setDuration(reply.getDuration());
        vi.addReply(replyInstance);

        ScriptEntity s = new ScriptEntity();                                    // Run the impact
        s.setContent(reply.getImpact());

        return sm.runScript(gameModelId, playerId, s);
    }

    /**
     *
     * @return
     */
    @Override
    protected MCQVariableDescriptorEntityFacade getFacade() {
        return this.mCQVariableDescriptorFacade;
    }
}
