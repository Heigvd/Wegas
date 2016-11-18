/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.game.Player;
import com.wegas.mcq.persistence.*;

import javax.ejb.LocalBean;
import javax.ejb.Singleton;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.inject.Inject;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Singleton
@LocalBean
public class QuestionSingleton {

    @Inject
    RequestManager requestManager;

    /**
     * @param instanceId
     * @return count the number of reply for the given question
     */
    public int findReplyCount(Long instanceId) {
        final TypedQuery<Long> query = requestManager.getEntityManager().createNamedQuery("Reply.countForInstance", Long.class);
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
        ChoiceDescriptor choice = requestManager.getEntityManager().find(ChoiceDescriptor.class, choiceId);

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
//        em.flush();
        return reply;
    }

    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)                // Require new transaction
    public Reply createReplyTransactional(Long choiceId, Player player, Long startTime) {
        return createReplyNonTransactional(choiceId, player, startTime);
    }

    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)                // cancelReply
    public Reply cancelReplyTransactional(Long replyId) {
        final Reply reply = requestManager.getEntityManager().find(Reply.class, replyId);
        reply.getQuestionInstance().getReplies().remove(reply);
        requestManager.getEntityManager().remove(reply);
        return reply;
    }
}
