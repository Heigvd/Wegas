/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.event.internal.DescriptorRevivedEvent;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.exception.WegasException;
import com.wegas.mcq.persistence.*;
import java.util.HashMap;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
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
@LocalBean
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
    private ScriptFacade scriptManager;
    @EJB
    QuestionSingleton questionSingleton;

    public void descriptorRevivedEvent(@Observes DescriptorRevivedEvent event) {
        logger.debug("Received DescriptorRevivedEvent event");

        if (event.getEntity() instanceof ChoiceDescriptor) {
            ChoiceDescriptor choice = (ChoiceDescriptor) event.getEntity();
            ChoiceInstance defaultInstance = ((ChoiceInstance) choice.getDefaultInstance());
            if (defaultInstance.getSerializedResultIndex() != -1
                    && defaultInstance.getSerializedResultIndex() < choice.getResults().size()) {
                Result cr = choice.getResults().get(defaultInstance.getSerializedResultIndex());

                defaultInstance.setCurrentResultId(cr.getId());
                defaultInstance.setCurrentResult(cr);
            }
        }

    }

    /**
     *
     */
    public QuestionDescriptorFacade() {
        super(ChoiceDescriptor.class);
    }

    public Reply updateReply(Long replyId, Reply r) {
        final Reply oldEntity = this.em.find(Reply.class, replyId);
        oldEntity.merge(r);
        return oldEntity;
    }

    public int findReplyCount(Long instanceId) {
        final Query query = em.createQuery("SELECT COUNT(r) FROM Reply r WHERE r.questionInstance.id = :id");
        query.setParameter("id", instanceId);
        return ((Number) query.getSingleResult()).intValue();
    }

    /**
     *
     * @param choiceId
     * @param player
     * @param startTime
     * @return
     * @throws WegasException
     */
//    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)                // Require new transaction
//    @TransactionManagement(TransactionManagementType.BEAN)
//    @Lock(LockType.WRITE)
//    public Reply createReply(Long choiceId, Player player, Long startTime) throws WegasException {
//        ChoiceDescriptor choice = em.find(ChoiceDescriptor.class, choiceId);
//
//        QuestionDescriptor questionDescriptor = choice.getQuestion();
//        QuestionInstance questionInstance = questionDescriptor.getInstance(player);
//
//        System.out.println("Test222 " + questionInstance.getReplies().size()
//                + "*" + questionInstance.getId()
//                + "*" + this.findReplyCount(questionInstance.getId())
//                + "*" + questionInstance.getReplies().size());
//        if (!questionDescriptor.getAllowMultipleReplies()
//                && this.findReplyCount(questionInstance.getId()) > 0) {         // @fixme Need to check reply count this way, otherwise in case of double request, both will be added
//            //if (!questionDescriptor.getAllowMultipleReplies()
//            //&& !questionInstance.getReplies().isEmpty()) {                    // Does not work when sending 2 requests at once
//            throw new WegasException("You have already answered this question");
//        }
//
//        Reply reply = new Reply();
//        reply.setStartTime(startTime);
//        reply.setResult(choice.getInstance(player).getResult());
//        questionInstance.addReply(reply);
////        em.persist(reply);
//        em.flush();
//        em.refresh(reply);
//        return reply;
//    }

    public Reply selectChoice(Long choiceId, Player player, Long startTime) throws WegasException {
        Reply reply = questionSingleton.createReply(choiceId, player, startTime);

        HashMap<String, AbstractEntity> arguments = new HashMap<>();            // Throw an event
        arguments.put("selectedReply", reply);
        try {
            scriptManager.eval(player,
                    new Script("eventManager.fire(\"replySelect\", {reply: selectedReply});"),
                    arguments);
        } catch (ScriptException e) {
            // GOTCHA no eventManager is instantiated
        }

        return reply;
    }

    /**
     *
     * @param choiceId
     * @param playerId
     * @param startTime
     * @return
     * @throws WegasException
     */
    public Reply selectChoice(Long choiceId, Long playerId) {
        return this.selectChoice(choiceId, playerFacade.find(playerId), Long.valueOf(0));
    }

    public Reply selectChoice(Long choiceId, Long playerId, Long startTime) {
        return this.selectChoice(choiceId, playerFacade.find(playerId), startTime);
    }

    public Reply selectAndValidateChoice(Long choiceId, Long playerId) throws ScriptException {
        Reply reply = this.selectChoice(choiceId, playerFacade.find(playerId), Long.valueOf(0));
        try {
            this.validateReply(playerId, reply.getId());
        } catch (ScriptException e) {
            this.cancelReply(playerId, reply.getId());
            throw e;
        }
        return reply;
    }

    /**
     *
     * @param playerId
     * @param replyId
     * @return
     */
    public Reply cancelReply(Long playerId, Long replyId) {

        Reply reply = em.find(Reply.class, replyId);
        em.remove(reply);

        HashMap<String, AbstractEntity> arguments = new HashMap<>();            // Throw an event
        arguments.put("selectedReply", reply);
        try {
            scriptManager.eval(playerFacade.find(playerId),
                    new Script("eventManager.fire(\"replyCancel\", {reply: selectedReply});"),
                    arguments);
        } catch (ScriptException e) {
            // GOTCHA no eventManager is instantiated
        }

        return reply;
    }

    /**
     *
     * @param player
     * @param reply
     * @throws ScriptException
     * @throws WegasException
     */
    public void validateReply(Player player, Reply reply) throws ScriptException, WegasException {
        ChoiceDescriptor choiceDescriptor = reply.getResult().getChoiceDescriptor();
        reply.setResult(choiceDescriptor.getInstance(player).getResult());       // Refresh the current result

        HashMap<String, AbstractEntity> arguments = new HashMap<>();            // Eval impacts
        arguments.put("selectedReply", reply);
        arguments.put("selectedChoice", choiceDescriptor.getInstance(player));
        arguments.put("selectedQuestion", reply.getQuestionInstance());
        scriptManager.eval(player, reply.getResult().getImpact(), arguments);
        try {                                                                   // Throw a global event
            scriptManager.eval(player,
                    new Script("eventManager.fire(\"replyValidate\", {reply: selectedReply, choice:selectedChoice, question:selectedQuestion});"),
                    arguments);
        } catch (ScriptException e) {
            // GOTCHA no eventManager is instantiated
        }
    }

    /**
     *
     * @param player
     * @param replyVariableInstanceId
     * @throws ScriptException
     * @throws WegasException
     */
    public void validateReply(Player player, Long replyVariableInstanceId) throws ScriptException, WegasException {
        this.validateReply(player, em.find(Reply.class, replyVariableInstanceId));
    }

    /**
     *
     * @param playerId
     * @param replyVariableInstanceId
     * @throws ScriptException
     * @throws WegasException
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
