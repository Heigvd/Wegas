/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.ejb.*;
import com.wegas.core.event.internal.DescriptorRevivedEvent;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Player;
import com.wegas.mcq.persistence.*;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.persistence.NoResultException;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class QuestionDescriptorFacade extends BaseFacade<ChoiceDescriptor> {

    static final private Logger logger = LoggerFactory.getLogger(QuestionDescriptorFacade.class);

    @Inject
    private Event<ReplyValidate> replyValidate;

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

    /**
     *
     */
    @EJB
    private RequestFacade requestFacade;

    /**
     *
     */
    @EJB
    QuestionSingleton questionSingleton;

    /**
     *
     */
    @Inject
    private ScriptEventFacade scriptEvent;

    /**
     * Find a result identified by the given name belonging to the given
     * descriptor
     *
     * @param choiceDescriptor
     * @param name
     * @return
     * @throws WegasNoResultException
     */
    public Result findResult(final ChoiceDescriptor choiceDescriptor, final String name) throws WegasNoResultException {
        final CriteriaBuilder cb = getEntityManager().getCriteriaBuilder();
        final CriteriaQuery cq = cb.createQuery();
        Root<Result> result = cq.from(Result.class);
        cq.where(cb.and(
            cb.equal(result.get("choiceDescriptor"), choiceDescriptor),
            cb.like(result.get("name"), name)));
        final Query q = getEntityManager().createQuery(cq);
        try {
            return (Result) q.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    /**
     * @param event
     */
    public void descriptorRevivedEvent(@Observes DescriptorRevivedEvent event) {
        logger.debug("Received DescriptorRevivedEvent event");

        if (event.getEntity() instanceof ChoiceDescriptor) {
            ChoiceDescriptor choice = (ChoiceDescriptor) event.getEntity();
            ChoiceInstance defaultInstance = ((ChoiceInstance) choice.getDefaultInstance());
            if (defaultInstance.getDeserializedCurrentResultName() != null && !defaultInstance.getDeserializedCurrentResultName().isEmpty()) {
                try {
                    Result cr = findResult(choice, defaultInstance.getDeserializedCurrentResultName());
                    choice.changeCurrentResult(defaultInstance, cr);
                    //defaultInstance.setCurrentResult(cr);
                } catch (WegasNoResultException ex) {
                    throw WegasErrorMessage.error("Error while setting current result");
                }
            } else if (defaultInstance.getCurrentResultIndex() != null
                && defaultInstance.getCurrentResultIndex() >= 0
                && defaultInstance.getCurrentResultIndex() < choice.getResults().size()) {

                Result cr = choice.getResults().get(defaultInstance.getCurrentResultIndex());
                //defaultInstance.setCurrentResult(cr);
                choice.changeCurrentResult(defaultInstance, cr);
            }
        }
    }

    /**
     *
     */
    public QuestionDescriptorFacade() {
        super(ChoiceDescriptor.class);
    }

    /**
     * @param replyId
     * @param r
     * @return
     */
    public Reply updateReply(Long replyId, Reply r) {
        final Reply oldEntity = this.getEntityManager().find(Reply.class, replyId);
        oldEntity.merge(r);
        return oldEntity;
    }

    /**
     * @return
     * @deprecated @param instanceId
     */
    public int findReplyCount(Long instanceId) {
        final Query query = getEntityManager().createQuery("SELECT COUNT(r) FROM Reply r WHERE r.questionInstance.id = :id");
        query.setParameter("id", instanceId);
        try {
            return ((Number) query.getSingleResult()).intValue();
        } catch (NoResultException ex) {
            return 0;
        }
    }

    /**
     * @param choiceId
     * @param player
     * @return
     */
    public Reply ignoreChoice(Long choiceId, Player player) {

        ChoiceDescriptor choice = getEntityManager().find(ChoiceDescriptor.class, choiceId);
        QuestionDescriptor questionDescriptor = choice.getQuestion();
        if (!questionDescriptor.getCbx()) {
            logger.error("ignoreChoice() invoked on a Question which is not of checkbox type");
        }

        Reply reply = questionSingleton.createReply(choiceId, player, -1L); // Negative startTime: hack to signal ignoration
        try {
            scriptEvent.fire(player, "replyIgnore", new ReplyValidate(reply));
        } catch (WegasScriptException e) {
            // GOTCHA no eventManager is instantiated
            logger.error("EventListener error (\"replySelect\")", e);
        }
        return reply;
    }

    /**
     * @param choiceId
     * @param player
     * @param startTime
     * @return
     */
    public Reply selectChoice(Long choiceId, Player player, Long startTime) {

        ChoiceDescriptor choice = getEntityManager().find(ChoiceDescriptor.class, choiceId);
        QuestionDescriptor questionDescriptor = choice.getQuestion();
        // Verify if mutually exclusive replies must be cancelled:
        if (questionDescriptor.getCbx() && !questionDescriptor.getAllowMultipleReplies()) {
            for (Reply r : questionDescriptor.getInstance(player).getReplies()) {
                if (!r.getResult().getChoiceDescriptor().equals(choice)
                    && !r.getIgnored()) {
                    this.cancelReply(player.getId(), r.getId());
                }
            }
        }

        Reply reply = questionSingleton.createReply(choiceId, player, startTime);
        try {
            scriptEvent.fire(player, "replySelect", new ReplyValidate(reply));
        } catch (WegasScriptException e) {
            // GOTCHA no eventManager is instantiated
            logger.error("EventListener error (\"replySelect\")", e);
        }

        return reply;
    }

    /**
     * @param choiceId
     * @param playerId
     * @return
     */
    public Reply selectChoice(Long choiceId, Long playerId) {
        return this.selectChoice(choiceId, playerFacade.find(playerId), (long) 0);
    }

    /**
     * @param choiceId
     * @param playerId
     * @param startTime
     * @return
     */
    public Reply selectChoice(Long choiceId, Long playerId, Long startTime) {
        return this.selectChoice(choiceId, playerFacade.find(playerId), startTime);
    }

    /**
     * @param choiceId
     * @param playerId
     * @return
     */
    public Reply selectAndValidateChoice(Long choiceId, Long playerId) {
        Player player = playerFacade.find(playerId);
        Reply reply = this.selectChoice(choiceId, player, (long) 0);
        try {
            this.validateReply(player, reply.getId());
        } catch (WegasRuntimeException e) {
            logger.error("CANCEL REPLY", e);
            this.cancelReplyTransactionnal(playerId, reply.getId());
            throw e;
        }
        return reply;
    }

    /**
     * FOR TEST USAGE ONLY
     *
     * @param choiceId
     * @param playerId
     * @return
     * @throws WegasRuntimeException
     */
    public Reply selectAndValidateChoiceTEST(Long choiceId, Long playerId) throws WegasRuntimeException {
        Reply reply = this.selectChoiceTEST(choiceId, playerFacade.find(playerId), (long) 0);
        try {
            this.validateReply(playerId, reply.getId());
        } catch (WegasRuntimeException e) {
            this.cancelReply(playerId, reply.getId());
            throw e;
        }

        requestFacade.commit();
        return reply;
    }

    /**
     * FOR TEST USAGE ONLY
     *
     * @param choiceId
     * @param player
     * @param startTime
     * @return
     */
    public Reply selectChoiceTEST(Long choiceId, Player player, Long startTime) {
        Reply reply = questionSingleton.createReplyUntransactionnal(choiceId, player, startTime);
        try {
            scriptEvent.fire(player, "replySelect", new ReplyValidate(reply));
        } catch (WegasScriptException e) {
            // GOTCHA no eventManager is instantiated
            logger.error("EventListener error (\"replySelect\") (TEST)", e);
        }

        return reply;
    }

    /**
     * @param playerId
     * @param replyId
     * @return
     */
    public Reply cancelReplyTransactionnal(Long playerId, Long replyId) {
        Reply reply = questionSingleton.cancelReplyTransactionnal(playerId, replyId);
        //try {
        //scriptEvent.fire(playerFacade.find(playerId), "replyCancel", new ReplyValidate(reply));// Throw an event
        //} catch (WegasRuntimeException e) {
        // GOTCHA no eventManager is instantiated
        //}
        return reply;
    }

    /**
     * @param playerId
     * @param replyId
     * @return
     */
    public Reply cancelReply(Long playerId, Long replyId) {

        final Reply reply = getEntityManager().find(Reply.class, replyId);
        getEntityManager().remove(reply);

        try {
            scriptEvent.fire(playerFacade.find(playerId), "replyCancel", new ReplyValidate(reply));// Throw an event
        } catch (WegasRuntimeException e) {
            // GOTCHA no eventManager is instantiated
        }

        return reply;
    }

    /**
     * @param player
     * @param validateReply
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    public void validateReply(final Player player, final Reply validateReply) throws WegasRuntimeException {
        final ChoiceDescriptor choiceDescriptor = validateReply.getResult().getChoiceDescriptor();
        validateReply.setResult(choiceDescriptor.getInstance(player).getResult());// Refresh the current result

        if (validateReply.getIgnored()) {
            scriptManager.eval(player, validateReply.getResult().getIgnorationImpact(), choiceDescriptor);
        } else {
            scriptManager.eval(player, validateReply.getResult().getImpact(), choiceDescriptor);
        }
        final ReplyValidate replyValidate = new ReplyValidate(validateReply, choiceDescriptor.getInstance(player), validateReply.getQuestionInstance(), player);
        try {
            if (validateReply.getIgnored()) {
                scriptEvent.fire(player, "replyIgnore", replyValidate);
            } else {
                scriptEvent.fire(player, "replyValidate", replyValidate);
            }
        } catch (WegasRuntimeException e) {
            logger.error("EventListener error (\"replyValidate\")", e);
            // GOTCHA no eventManager is instantiated
        }
        this.replyValidate.fire(replyValidate);
    }

    /**
     * @param player
     * @param replyVariableInstanceId
     */
    public void validateReply(Player player, Long replyVariableInstanceId) {
        this.validateReply(player, getEntityManager().find(Reply.class, replyVariableInstanceId));
    }

    /**
     * @param playerId
     * @param replyVariableInstanceId
     */
    public void validateReply(Long playerId, Long replyVariableInstanceId) {
        this.validateReply(playerFacade.find(playerId), replyVariableInstanceId);
    }

    /**
     * Validates a question that's marked as checkbox type: sequentially
     * validates all replies (i.e. selected choices)
     * and processes all other choices as "ignored".
     *
     * @param validateQuestion
     * @param player
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    public void validateQuestion(final QuestionInstance validateQuestion, final Player player) throws WegasRuntimeException {

        final QuestionDescriptor questionDescriptor = (QuestionDescriptor) validateQuestion.getDescriptor();
        if (!questionDescriptor.getCbx()) {
            logger.error("validateQuestion() invoked on a Question which is not of checkbox type");
            return;
        }

        // Don't validate questions with no replies
        if (validateQuestion.getReplies().isEmpty()) {
            throw new WegasErrorMessage(WegasErrorMessage.ERROR, "Please select a reply");
        }

        // Loop on all choices: validate all replies (checked choices) and "ignore" all unchecked choices.
        // NB: there should be only one reply per choice for each player.
        for (ChoiceDescriptor choice : questionDescriptor.getItems()) {
            // Test if the current choice has been selected, i.e. there is a reply for it.
            boolean found = false;
            for (Reply r : validateQuestion.getReplies()) {
                if (r.getResult().getChoiceDescriptor().equals(choice)) {
                    if (!r.getIgnored()) {
                        // It's been selected: validate the reply (which executes the impact)
                        this.validateReply(player, r);
                    } else {
                        logger.error("validateQuestion() invoked on a Question where ignored replies are already persisted");
                    }
                    found = true;
                    break;
                }
            }
            if (!found) {
                Reply ignoredReply = ignoreChoice(choice.getId(), player);
                this.validateReply(player, ignoredReply);
            }
        }

        getEntityManager().refresh(validateQuestion);
        validateQuestion.setValidated(true);
        getEntityManager().flush();
    }

    /**
     * @param questionInstanceId
     * @param player
     */
    public void validateQuestion(Long questionInstanceId, Player player) {
        this.validateQuestion(getEntityManager().find(QuestionInstance.class, questionInstanceId), player);
    }

    /**
     * @param questionInstanceId
     * @param playerId
     */
    public void validateQuestion(Long questionInstanceId, Long playerId) {
        this.validateQuestion(questionInstanceId, playerFacade.find(playerId));
    }

    @Override
    public void create(ChoiceDescriptor entity) {
        getEntityManager().persist(entity);
        entity.getQuestion().addItem(entity);
    }

    @Override
    public void remove(ChoiceDescriptor entity) {
        logger.error("ICI *********************************************** ICI");
        getEntityManager().remove(entity);
        entity.getQuestion().remove(entity);
    }

    /**
     *
     */
    public static class ReplyValidate {

        /**
         *
         */
        final public Reply reply;

        /**
         *
         */
        final public ChoiceInstance choice;

        /**
         *
         */
        final public QuestionInstance question;

        /**
         *
         */
        final public Player player;

        /**
         * @param reply
         * @param choice
         * @param question
         */
        public ReplyValidate(Reply reply, ChoiceInstance choice, QuestionInstance question, Player player) {
            this.reply = reply;
            this.choice = choice;
            this.question = question;
            this.player = player;
        }

        /**
         * @param reply
         */
        public ReplyValidate(Reply reply) {
            this.reply = reply;
            this.choice = null;
            this.question = null;
            this.player = null;
        }

    }
}
