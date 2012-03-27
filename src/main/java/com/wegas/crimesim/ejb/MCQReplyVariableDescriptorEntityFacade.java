/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.crimesim.ejb;

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.core.ejb.PlayerEntityFacade;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variabledescriptor.VariableDescriptorEntity;
import com.wegas.core.persistence.variableinstance.VariableInstanceEntity;
import com.wegas.core.script.ScriptEntity;
import com.wegas.core.script.ScriptManager;
import com.wegas.crimesim.persistence.variable.MCQReplyVariableDescriptorEntity;
import com.wegas.crimesim.persistence.variable.MCQReplyVariableInstanceEntity;
import com.wegas.crimesim.persistence.variable.MCQVariableInstanceEntity;
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
public class MCQReplyVariableDescriptorEntityFacade extends AbstractFacade<MCQReplyVariableDescriptorEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private PlayerEntityFacade playerEntityFacade;
    /**
     *
     */
    @EJB
    private MCQReplyVariableInstanceEntityFacade mCQReplyVariableInstanceEntityFacade;
    /**
     *
     */
    @EJB
    private ScriptManager sm;

    /**
     *
     */
    public MCQReplyVariableDescriptorEntityFacade() {
        super(MCQReplyVariableDescriptorEntity.class);
    }

    public MCQReplyVariableInstanceEntity selectReply(Long replyVariableDescriptorId, Long playerId, Long startTime) {
        MCQReplyVariableDescriptorEntity reply = this.find(replyVariableDescriptorId);
        PlayerEntity player = playerEntityFacade.find(playerId);

        VariableDescriptorEntity vd = reply.getMCQVariableDescriptor();
        MCQVariableInstanceEntity vi = (MCQVariableInstanceEntity) vd.getVariableInstance(player);
        MCQReplyVariableInstanceEntity replyInstance = new MCQReplyVariableInstanceEntity();

        replyInstance.setAnswer(reply.getAnswer());
        replyInstance.setDescription(reply.getDescription());
        replyInstance.setName(reply.getName());
        replyInstance.setStartTime(startTime);
        replyInstance.setDuration(reply.getDuration());
        vi.addReply(replyInstance);

        return replyInstance;
    }

    public List<VariableInstanceEntity> validateReply(Long replyVariableInstanceId, Long playerId) {
        MCQReplyVariableInstanceEntity reply = this.mCQReplyVariableInstanceEntityFacade.find(replyVariableInstanceId);

        ScriptEntity s = new ScriptEntity();                                    // Run the impact
        s.setContent(reply.getImpact());

        return sm.runScript(reply.getMCQVariableInstance().getScope().getVariableDescriptor().getGameModel().getId(), playerId, s);
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
