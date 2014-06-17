/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.persistence.game.Player;
import com.wegas.core.exception.WegasException;
import com.wegas.mcq.persistence.*;
import javax.ejb.LocalBean;
import javax.ejb.Singleton;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Singleton
@LocalBean
public class QuestionSingleton {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     * @param instanceId
     * @return
     */
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
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)                // Require new transaction
    public Reply createReply(Long choiceId, Player player, Long startTime) throws WegasException {
        ChoiceDescriptor choice = em.find(ChoiceDescriptor.class, choiceId);

        QuestionDescriptor questionDescriptor = choice.getQuestion();
        QuestionInstance questionInstance = questionDescriptor.getInstance(player);

        System.out.println("Test222 " + questionInstance.getReplies().size()
                + "*" + questionInstance.getId()
                + "*" + this.findReplyCount(questionInstance.getId())
                + "*" + questionInstance.getReplies().size());
        if (!questionDescriptor.getAllowMultipleReplies()
                && this.findReplyCount(questionInstance.getId()) > 0) {         // @fixme Need to check reply count this way, otherwise in case of double request, both will be added
            //if (!questionDescriptor.getAllowMultipleReplies()
            //&& !questionInstance.getReplies().isEmpty()) {                    // Does not work when sending 2 requests at once
            throw new WegasException("You have already answered this question");
        }

        Reply reply = new Reply();
        reply.setStartTime(startTime);
        reply.setResult(choice.getInstance(player).getResult());
        questionInstance.addReply(reply);
//        em.persist(reply);
        em.flush();
        em.refresh(reply);
        return reply;
    }
}
