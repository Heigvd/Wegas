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

import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.PlayerEntity;
import com.wegas.core.persistence.variable.ListDescriptorEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.script.ScriptFacade;
import com.wegas.mcq.persistence.ChoiceDescriptorEntity;
import com.wegas.mcq.persistence.QuestionDescriptorEntity;
import com.wegas.mcq.persistence.QuestionInstanceEntity;
import com.wegas.mcq.persistence.ReplyEntity;
import java.util.HashMap;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.script.ScriptException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class QuestionDescriptorFacade extends AbstractFacadeImpl<ChoiceDescriptorEntity> {

    static final private Logger logger = LoggerFactory.getLogger(QuestionDescriptorFacade.class);

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
    private ScriptFacade scriptManager;

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
     * @throws ScriptException
     */
    public void setCurrentTime(ListDescriptorEntity questionList, PlayerEntity player, Long time) throws ScriptException {
        for (VariableDescriptorEntity question : questionList.getItems()) {
            this.setCurrentTime((QuestionDescriptorEntity) question, player, time);
        }
    }

    /**
     *
     * @param question
     * @param player
     * @param time
     * @throws ScriptException
     */
    public void setCurrentTime(QuestionDescriptorEntity question, PlayerEntity player, Long time) throws ScriptException {
        QuestionInstanceEntity questionInstance = (QuestionInstanceEntity) question.getVariableInstance(player);
        for (ReplyEntity reply : questionInstance.getReplies()) {
           //logger.warn(reply.getStartTime()+"*"+reply.getChoiceDescriptor().getDuration()+"*"+time);
            if (reply.getStartTime() + reply.getChoiceDescriptor().getDuration() + 1  == time ) {
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
     * @param replyId
     * @return
     */
    public ReplyEntity cancelReply(Long replyId) {
        ReplyEntity reply = replyFacade.find(replyId);
        replyFacade.remove(reply);
        return reply;
    }

    /**
     *
     * @param player
     * @param reply
     * @return
     * @throws ScriptException
     */
    public void validateReply(PlayerEntity player, ReplyEntity reply) throws ScriptException {
        HashMap<String, AbstractEntity> arguments = new HashMap<String, AbstractEntity>();
        arguments.put("selectedReply", reply);
        scriptManager.eval(player, reply.getChoiceDescriptor().getImpact(), arguments);
    }

    /**
     *
     * @param player
     * @param replyVariableInstanceId
     * @return
     * @throws ScriptException
     */
    public void validateReply(PlayerEntity player, Long replyVariableInstanceId) throws ScriptException {
        this.validateReply(player, this.replyFacade.find(replyVariableInstanceId));
    }

    /**
     *
     * @param playerId
     * @param replyVariableInstanceId
     * @return
     * @throws ScriptException
     */
    public void validateReply(Long playerId, Long replyVariableInstanceId) throws ScriptException {
        this.validateReply(playerFacade.find(playerId), replyVariableInstanceId);
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
