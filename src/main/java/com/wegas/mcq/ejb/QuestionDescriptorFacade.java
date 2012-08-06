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
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.mcq.persistence.*;
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
public class QuestionDescriptorFacade extends AbstractFacadeImpl<ChoiceDescriptor> {

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
        super(ChoiceDescriptor.class);
    }

    /**
     *
     * @param questionList
     * @param player
     * @param time
     * @throws ScriptException
     */
    public void setCurrentTime(ListDescriptor questionList, Player player, Long time) throws ScriptException {
        for (VariableDescriptor question : questionList.getItems()) {
            this.setCurrentTime((QuestionDescriptor) question, player, time);
        }
    }

    /**
     *
     * @param question
     * @param player
     * @param time
     * @throws ScriptException
     */
    public void setCurrentTime(QuestionDescriptor question, Player player, Long time) throws ScriptException {
        QuestionInstance questionInstance = (QuestionInstance) question.getInstance(player);
        for (Reply reply : questionInstance.getReplies()) {
            //logger.warn(reply.getStartTime()+"*"+reply.getChoiceDescriptor().getDuration()+"*"+time);
            if (reply.getStartTime() + reply.getResponse().getChoiceDescriptor().getDuration() + 1 == time) {
                this.validateReply(player, reply);
            }
        }
    }

    /**
     *
     * @param choiceId
     * @param playerId
     * @param startTime
     * @return
     */
    public Reply selectChoice(Long choiceId, Long playerId, Long startTime) {
        ChoiceDescriptor choice = getEntityManager().find(ChoiceDescriptor.class, choiceId);
        Player player = playerFacade.find(playerId);

        Query findListDescriptorByChildId = em.createNamedQuery("findListDescriptorByChildId");
        findListDescriptorByChildId.setParameter("itemId", choice.getId());
        QuestionDescriptor questionDescriptor = (QuestionDescriptor) findListDescriptorByChildId.getSingleResult();

        QuestionInstance questionInstance = (QuestionInstance) questionDescriptor.getInstance(player);
        Reply reply = new Reply();

        reply.setStartTime(startTime);
        reply.setResponse(choice.getInstance(player).getCurrentResponse());
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
    public Reply cancelReply(Long replyId) {
        Reply reply = replyFacade.find(replyId);
        replyFacade.remove(reply);
        return reply;
    }

    /**
     *
     * @param player
     * @param reply
     * @throws ScriptException
     */
    public void validateReply(Player player, Reply reply) throws ScriptException {
        HashMap<String, AbstractEntity> arguments = new HashMap<String, AbstractEntity>();
        ChoiceInstance choiceInstance = reply.getResponse().getChoiceDescriptor().getInstance(player);

        reply.setResponse(choiceInstance.getCurrentResponse());                 // Refresh the current response

        arguments.put("selectedReply", reply);
        arguments.put("selectedChoice", choiceInstance);
        arguments.put("selectedQuestion", reply.getQuestionInstance());
        scriptManager.eval(player, reply.getResponse().getImpact(), arguments);
        scriptManager.eval(player, reply.getResponse().getChoiceDescriptor().getImpact(), arguments);
    }

    /**
     *
     * @param player
     * @param replyVariableInstanceId
     * @throws ScriptException
     */
    public void validateReply(Player player, Long replyVariableInstanceId) throws ScriptException {
        this.validateReply(player, this.replyFacade.find(replyVariableInstanceId));
    }

    /**
     *
     * @param playerId
     * @param replyVariableInstanceId
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
