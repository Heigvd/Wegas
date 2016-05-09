/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.game.Player;
import com.wegas.mcq.persistence.*;

import javax.ejb.LocalBean;
import javax.ejb.Singleton;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Singleton
@LocalBean
public class QuestionSingleton {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     * @param instanceId
     * @return
     */
    public int findReplyCount(Long instanceId) {
        final TypedQuery<Long> query = em.createNamedQuery("Reply.countForInstance", Long.class);
        query.setParameter("instanceId", instanceId);
        try {
            return query.getSingleResult().intValue();
        } catch (NoResultException ex) {
            return 0;
        }
    }

    /**
     * @param choiceId
     * @param player
     * @param startTime
     * @return
     */
    private Reply createReplyNonTransactional(Long choiceId, Player player, Long startTime) {
        ChoiceDescriptor choice = em.find(ChoiceDescriptor.class, choiceId);

        QuestionDescriptor questionDescriptor = choice.getQuestion();
        QuestionInstance questionInstance = questionDescriptor.getInstance(player);

        Boolean isCbx = questionDescriptor.getCbx();
        if (!isCbx
                && !questionDescriptor.getAllowMultipleReplies()
                && this.findReplyCount(questionInstance.getId()) > 0) {         // @fixme Need to check reply count this way, otherwise in case of double request, both will be added
            //if (!questionDescriptor.getAllowMultipleReplies()
            //&& !questionInstance.getReplies().isEmpty()) {                    // Does not work when sending 2 requests at once
            throw WegasErrorMessage.error("You have already answered this question");
        }

        Reply reply = new Reply();
        if (isCbx && startTime < 0) { // Hack to signal ignoration
            reply.setStartTime(0L);
            reply.setIgnored(true);
        } else {
            reply.setStartTime(startTime);
        }
        Result result = choice.getInstance(player).getResult();
        reply.setResult(result);
        result.addReply(reply);
        questionInstance.addReply(reply);
        //em.persist(reply);
        em.flush();
        em.refresh(reply);
        return reply;
    }

    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)                // Require new transaction
    public Reply createReplyTransactional(Long choiceId, Player player, Long startTime) {
        return createReplyNonTransactional(choiceId, player, startTime);
    }

    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)                // cancelReply
    public Reply cancelReplyTransactional(Long playerId, Long replyId) {
        final Reply reply = em.find(Reply.class, replyId);
        reply.getQuestionInstance().getReplies().remove(reply);
        em.remove(reply);
        return reply;
    }
}
