/*
 * Wegas
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
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.exception.WegasException;
import com.wegas.mcq.persistence.*;
import java.util.HashMap;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
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
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

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
    public void setCurrentTime(ListDescriptor questionList, Player player, Long time) throws ScriptException, WegasException {
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
    public void setCurrentTime(QuestionDescriptor question, Player player, Long time) throws ScriptException, WegasException {
        QuestionInstance questionInstance = (QuestionInstance) question.getInstance(player);
        for (Reply reply : questionInstance.getReplies()) {
            //logger.warn(reply.getStartTime()+"*"+reply.getChoiceDescriptor().getDuration()+"*"+time);
            if (reply.getStartTime() + reply.getResult().getChoiceDescriptor().getDuration() + 1 == time) {
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
    public Reply selectChoice(Long choiceId, Player player, Long startTime) throws WegasException {
        ChoiceDescriptor choice = em.find(ChoiceDescriptor.class, choiceId);

        QuestionDescriptor questionDescriptor = (QuestionDescriptor) variableDescriptorFacade.findParentListDescriptor(choice);

        QuestionInstance questionInstance = (QuestionInstance) questionDescriptor.getInstance(player);
        Reply reply = new Reply();

        reply.setStartTime(startTime);
        reply.setResult(this.getCurrentResult(player, choice));
        questionInstance.addReply(reply);

        em.flush();
        em.refresh(reply);

        return reply;
    }

    /**
     *
     * @param choiceId
     * @param playerId
     * @param startTime
     * @return
     */
    public Reply selectChoice(Long choiceId, Long playerId, Long startTime) throws WegasException {
        return this.selectChoice(choiceId, playerFacade.find(playerId), startTime);
    }

    private Result getCurrentResult(Player p, ChoiceDescriptor choice) throws WegasException {
        Result r = choice.getInstance(p).getCurrentResult();
        if (r == null) {
            try {
                r = choice.getResults().get(0);
            } catch (ArrayIndexOutOfBoundsException ex) {
                throw new WegasException("No result found for choice \"" + choice.getEditorLabel() + "\"", ex);
            }
        }
        return r;
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
    public void validateReply(Player player, Reply reply) throws ScriptException, WegasException {
        ChoiceDescriptor choiceDescriptor = reply.getResult().getChoiceDescriptor();
        reply.setResult(this.getCurrentResult(player, choiceDescriptor));       // Refresh the current result

        HashMap<String, AbstractEntity> arguments = new HashMap<>();            // Eval impacts
        arguments.put("selectedReply", reply);
        arguments.put("selectedChoice", choiceDescriptor.getInstance(player));
        arguments.put("selectedQuestion", reply.getQuestionInstance());
        scriptManager.eval(player, reply.getResult().getImpact(), arguments);
        scriptManager.eval(player, reply.getResult().getChoiceDescriptor().getImpact(), arguments);
    }

    /**
     *
     * @param player
     * @param replyVariableInstanceId
     * @throws ScriptException
     */
    public void validateReply(Player player, Long replyVariableInstanceId) throws ScriptException, WegasException {
        this.validateReply(player, this.replyFacade.find(replyVariableInstanceId));
    }

    /**
     *
     * @param playerId
     * @param replyVariableInstanceId
     * @throws ScriptException
     */
    public void validateReply(Long playerId, Long replyVariableInstanceId) throws ScriptException, WegasException {
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
