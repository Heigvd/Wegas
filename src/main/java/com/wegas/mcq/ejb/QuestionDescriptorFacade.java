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
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.ListDescriptorEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import com.wegas.core.script.ScriptManager;
import com.wegas.mcq.persistence.ChoiceDescriptorEntity;
import com.wegas.mcq.persistence.QuestionDescriptorEntity;
import com.wegas.mcq.persistence.QuestionInstanceEntity;
import com.wegas.mcq.persistence.ReplyEntity;
import java.util.HashMap;
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
public class QuestionDescriptorFacade extends AbstractFacade<ChoiceDescriptorEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    /**
     *
     */
    @EJB
    private ReplyFacade replyFacade;
    /**
     *
     */
    @EJB
    private ScriptManager scriptManager;

    /**
     *
     */
    public QuestionDescriptorFacade() {
        super(ChoiceDescriptorEntity.class);
    }

    /**
     *
     * @param questionList
     * @param player
     * @param time
     */
    public void setCurrentTime(ListDescriptorEntity questionList, PlayerEntity player, Long time) {
        for (VariableDescriptorEntity question : questionList.getItems()) {
            this.setCurrentTime((QuestionDescriptorEntity) question, player, time);
        }
    }

    /**
     *
     * @param question
     * @param player
     * @param time
     */
    public void setCurrentTime(QuestionDescriptorEntity question, PlayerEntity player, Long time) {
        QuestionInstanceEntity questionInstance = (QuestionInstanceEntity) question.getVariableInstance(player);
        for (ReplyEntity reply : questionInstance.getReplies()) {
            if (reply.getStartTime().equals(time)) {
                this.validateReply(player, reply);
            }
        }
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
        PlayerEntity player = playerFacade.find(playerId);

        Query findListDescriptorByChildId = em.createNamedQuery("findListDescriptorByChildId");
        findListDescriptorByChildId.setParameter("itemId", choiceDescriptorId);
        QuestionDescriptorEntity questionDescriptor = (QuestionDescriptorEntity) findListDescriptorByChildId.getSingleResult();

        QuestionInstanceEntity questionInstance = (QuestionInstanceEntity) questionDescriptor.getVariableInstance(player);
        ReplyEntity reply = new ReplyEntity();

        reply.setChoiceDescriptor(choiceDescriptor);
        reply.setStartTime(startTime);
        questionInstance.addReply(reply);

        this.em.flush();
        this.em.refresh(reply);

        return reply;
    }

    /**
     *
     * @param replyVariableInstanceId
     * @param playerId
     * @return
     */
    public List<VariableInstanceEntity> validateReply(PlayerEntity player, ReplyEntity reply) {
        HashMap<String, AbstractEntity> arguments = new HashMap<>();
        arguments.put("selectedReply", reply);
        return scriptManager.eval(player, reply.getChoiceDescriptor().getImpact());
    }

    public List<VariableInstanceEntity> validateReply(PlayerEntity player, Long replyVariableInstanceId) {
        return this.validateReply(player, this.replyFacade.find(replyVariableInstanceId));
    }

    public List<VariableInstanceEntity> validateReply(Long playerId, Long replyVariableInstanceId) {
        return this.validateReply(playerFacade.find(playerId), replyVariableInstanceId);
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
