/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.crimesim.ejb;

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import com.wegas.core.script.ScriptEntity;
import com.wegas.core.script.ScriptManager;
import com.wegas.crimesim.persistence.variable.MCQReplyDescriptorEntity;
import com.wegas.crimesim.persistence.variable.MCQReplyInstanceEntity;
import com.wegas.crimesim.persistence.variable.MCQInstanceEntity;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class MCQReplyDescriptorFacade extends AbstractFacade<MCQReplyDescriptorEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private PlayerFacade playerEntityFacade;
    /**
     *
     */
    @EJB
    private MCQReplyInstanceFacade mCQReplyVariableInstanceEntityFacade;
    /**
     *
     */
    @EJB
    private ScriptManager scriptManager;

    /**
     *
     */
    public MCQReplyDescriptorFacade() {
        super(MCQReplyDescriptorEntity.class);
    }

    /**
     *
     * @param replyVariableDescriptorId
     * @param playerId
     * @param startTime
     * @return
     */
    public MCQReplyInstanceEntity selectReply(Long replyVariableDescriptorId, Long playerId, Long startTime) {
        MCQReplyDescriptorEntity reply = this.find(replyVariableDescriptorId);
        PlayerEntity player = playerEntityFacade.find(playerId);

        VariableDescriptorEntity vd = reply.getMCQVariableDescriptor();
        MCQInstanceEntity vi = (MCQInstanceEntity) vd.getVariableInstance(player);
        MCQReplyInstanceEntity replyInstance = new MCQReplyInstanceEntity();

        replyInstance.setAnswer(reply.getAnswer());
        replyInstance.setDescription(reply.getDescription());
        replyInstance.setName(reply.getName());
        replyInstance.setStartTime(startTime);
        replyInstance.setDuration(reply.getDuration());
        vi.addReply(replyInstance);

        return replyInstance;
    }

    /**
     *
     * @param replyVariableInstanceId
     * @param playerId
     * @return
     */
    public List<VariableInstanceEntity> validateReply(Long replyVariableInstanceId, Long playerId) {
        MCQReplyInstanceEntity reply = this.mCQReplyVariableInstanceEntityFacade.find(replyVariableInstanceId);

        return scriptManager.runScript(reply.getMCQVariableInstance().getScope().getVariableDescriptor().getGameModel().getId(),
                playerId, reply.getImpact());
    }

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }
}
