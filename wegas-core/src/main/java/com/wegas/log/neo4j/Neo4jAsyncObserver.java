package com.wegas.log.neo4j;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.persistence.NumberListener;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.QuestionDescriptor;

import javax.ejb.Asynchronous;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;

/**
 * Simple Async Observer
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Stateless
@Asynchronous
public class Neo4jAsyncObserver {
    @EJB
    private Neo4jPlayerReply playerReply;

    public void onReplyValidate(@Observes QuestionDescriptorFacade.ReplyValidate event) throws JsonProcessingException {
        playerReply.addPlayerReply(event.player, event.reply, (ChoiceDescriptor) event.choice.getDescriptor(), (QuestionDescriptor) event.question.getDescriptor());
    }

    public void onNumberUpdate(@Observes NumberListener.NumberUpdate update) throws NoPlayerException, JsonProcessingException {
        playerReply.addNumberUpdate(update.player, update.number);
    }
}
