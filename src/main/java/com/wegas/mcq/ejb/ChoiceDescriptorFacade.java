/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.mcq.ejb;

import com.wegas.core.ejb.AbstractFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import com.wegas.core.script.ScriptManager;
import com.wegas.mcq.persistence.ChoiceDescriptorEntity;
import com.wegas.mcq.persistence.QuestionDescriptorEntity;
import com.wegas.mcq.persistence.QuestionInstanceEntity;
import com.wegas.mcq.persistence.ReplyEntity;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class ChoiceDescriptorFacade extends AbstractFacade<ChoiceDescriptorEntity> {

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
    private ReplyFacade mCQReplyVariableInstanceEntityFacade;
    /**
     *
     */
    @EJB
    private ScriptManager scriptManager;

    /**
     *
     */
    public ChoiceDescriptorFacade() {
        super(ChoiceDescriptorEntity.class);
    }

    /**
     *
     * @param choiceDescriptorId
     * @param playerId
     * @param startTime
     * @return
     */
    public ReplyEntity selectChoice(Long choiceDescriptorId, Long playerId, Long startTime) {
        ChoiceDescriptorEntity choiceDescriptor = this.find(choiceDescriptorId);
        PlayerEntity player = playerEntityFacade.find(playerId);

        Query findListDescriptorByChildId = em.createNamedQuery("findListDescriptorByChildId");
        findListDescriptorByChildId.setParameter("itemId", choiceDescriptorId);
        QuestionDescriptorEntity questionDescriptor = (QuestionDescriptorEntity) findListDescriptorByChildId.getSingleResult();

        QuestionInstanceEntity questionInstance = (QuestionInstanceEntity) questionDescriptor.getVariableInstance(player);
        ReplyEntity reply = new ReplyEntity();

        reply.setChoiceDescriptor(choiceDescriptor);
        reply.setStartTime(startTime);
        reply.setDuration(choiceDescriptor.getDuration());
        questionInstance.addReply(reply);

        return reply;
    }

    /**
     *
     * @param replyVariableInstanceId
     * @param playerId
     * @return
     */
    public List<VariableInstanceEntity> validateReply(Long replyVariableInstanceId, Long playerId) {
        ReplyEntity reply = this.mCQReplyVariableInstanceEntityFacade.find(replyVariableInstanceId);

        return scriptManager.runScript(reply.getQuestionInstance().getScope().getVariableDescriptor().getGameModel().getId(),
                playerId, reply.getChoiceDescriptor().getImpact());
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
