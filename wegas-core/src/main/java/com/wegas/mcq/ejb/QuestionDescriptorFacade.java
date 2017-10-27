/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.Helper;
import com.wegas.core.api.QuestionDescriptorFacadeI;
import com.wegas.core.ejb.*;
import com.wegas.core.event.internal.InstanceRevivedEvent;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Player;
import com.wegas.mcq.persistence.*;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.enterprise.event.Event;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.naming.NamingException;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class QuestionDescriptorFacade extends BaseFacade<ChoiceDescriptor> implements QuestionDescriptorFacadeI {

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
     * @EJB QuestionSingleton questionSingleton;
     */
    /**
     *
     */
    @Inject
    private ScriptEventFacade scriptEvent;

    /**
     *
     */
    @Inject
    private VariableInstanceFacade variableInstanceFacade;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     * Find a result identified by the given name belonging to the given
     * descriptor
     *
     * @param choiceDescriptor
     * @param name
     *
     * @return the given ChoiceDescriptor Result that matches the name
     *
     * @throws WegasNoResultException if not found
     */
    public Result findResult(final ChoiceDescriptor choiceDescriptor, final String name) throws WegasNoResultException {
        if (!Helper.isNullOrEmpty(name)) {
            for (Result result : choiceDescriptor.getResults()) {
                if (name.equals(result.getName())) {
                    return result;
                }
            }
        }

        throw new WegasNoResultException("Result \"" + name + "\" not found");
    }

    public Result findResult(final QuestionDescriptor questionDescriptor, final String choiceName, final String resultName) throws WegasNoResultException {
        if (!Helper.isNullOrEmpty(resultName) && !Helper.isNullOrEmpty(choiceName)) {
            for (ChoiceDescriptor choiceDescriptor : questionDescriptor.getItems()) {
                if (choiceName.equals(choiceDescriptor.getName())) {
                    return this.findResult(choiceDescriptor, resultName);
                }
            }
        }
        throw new WegasNoResultException("Result \"" + choiceName + "/" + resultName + "\" not found");
    }

    public Result findResultTQ(final ChoiceDescriptor choiceDescriptor, final String name) throws WegasNoResultException {
        final TypedQuery<Result> query = getEntityManager().createNamedQuery("Result.findByName", Result.class);
        query.setParameter("choicedescriptorId", choiceDescriptor.getId());
        query.setParameter("name", name);
        try {
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }

    public Result findResult(Long id) {
        return this.getEntityManager().find(Result.class, id);
    }

    /**
     * @param event
     */
    public void instanceRevivedEvent(@Observes InstanceRevivedEvent event) {

        if (event.getEntity() instanceof ChoiceInstance) {
            logger.info("Received DescriptorRevivedEvent event");
            ChoiceInstance choiceInstance = (ChoiceInstance) event.getEntity();
            ChoiceDescriptor choice = (ChoiceDescriptor) choiceInstance.findDescriptor();

            if (choiceInstance.getCurrentResultName() != null && !choiceInstance.getCurrentResultName().isEmpty()) {
                logger.info("ReviveResultByName");
                try {
                    Result cr = findResult(choice, choiceInstance.getCurrentResultName());
                    choice.changeCurrentResult(choiceInstance, cr);
                    //defaultInstance.setCurrentResult(cr);
                } catch (WegasNoResultException ex) {
                    choice.changeCurrentResult(choiceInstance, null);
                    logger.error("No Such Result !!!");
                }
            } else if (choiceInstance.getCurrentResultIndex() != null
                    && choiceInstance.getCurrentResultIndex() >= 0
                    && choiceInstance.getCurrentResultIndex() < choice.getResults().size()) {
                // Backward compat

                logger.error(" !!!!  REVIVE RESULT BY INDEX !!!! (so 2013...)");
                Result cr = choice.getResults().get(choiceInstance.getCurrentResultIndex());
                //defaultInstance.setCurrentResult(cr);
                choice.changeCurrentResult(choiceInstance, cr);
            }
            for (Reply r : choiceInstance.getReplies()) {
                try {
                    Result result = findResult(choice, r.getResultName());
                    result.addReply(r);
                    r.setResult(result);
                } catch (WegasNoResultException ex) {
                    logger.error("NO SUCH RESULT ! ");
                }
            }
        }
    }

    /**
     *
     */
    public QuestionDescriptorFacade() {
        super(ChoiceDescriptor.class);
    }

    public Reply findReply(Long id) {
        return this.getEntityManager().find(Reply.class, id);
    }

    /**
     * @param replyId
     * @param r
     *
     * @return the updated reply
     */
    public Reply updateReply(Long replyId, Reply r) {
        final Reply oldEntity = this.findReply(replyId);
        oldEntity.merge(r);
        return oldEntity;
    }

    private Reply createReply(Long choiceId, Player player, Long startTime) {
        ChoiceDescriptor choice = (ChoiceDescriptor) variableDescriptorFacade.find(choiceId);
        ChoiceInstance choiceInstance = choice.getInstance(player);

        QuestionDescriptor questionDescriptor = choice.getQuestion();
        QuestionInstance questionInstance = questionDescriptor.getInstance(player);

        Boolean isCbx = questionDescriptor.getCbx();
        if (!isCbx
                && !questionDescriptor.getAllowMultipleReplies()
                && !questionInstance.getReplies(player).isEmpty()) {         // @fixme Need to check reply count this way, otherwise in case of double request, both will be added
            //&& this.findReplyCount(questionInstance) > 0) {         // @fixme Need to check reply count this way, otherwise in case of double request, both will be added
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
        result.addReply(reply);
        reply.setResult(result);
        choiceInstance.addReply(reply);
        this.getEntityManager().persist(reply);
//        em.flush();
        return reply;
    }

    public QuestionInstance getQuestionInstanceFromReply(Reply reply) throws NoPlayerException {
        QuestionDescriptor findDescriptor = ((ChoiceDescriptor) reply.getChoiceInstance().findDescriptor()).getQuestion();
        return findDescriptor.findInstance(reply.getChoiceInstance());
    }

    /**
     * @param playerId id of player who wants to cancel the reply
     * @param replyId  id of reply to cancel
     *
     * @return reply being canceled
     */
    private Reply internalCancelReply(Long replyId) {
        try {
            final Reply reply = this.getEntityManager().find(Reply.class, replyId);
            QuestionInstance questionInstance = this.getQuestionInstanceFromReply(reply);
            requestFacade.getRequestManager().lock("MCQ-" + questionInstance.getId(), questionInstance.getBroadcastTarget());
            return this.internalCancelReply(reply);
        } catch (NoPlayerException ex) {
            throw WegasErrorMessage.error("NO PLAYER");
        }
    }

    private Reply internalCancelReply(Reply reply) {
        this.getEntityManager().remove(reply);
        return reply;
    }

    /**
     * Create an ignoration Reply
     *
     * @param choiceId
     * @param player
     *
     * @return new reply
     */
    public Reply ignoreChoice(Long choiceId, Player player) {

        ChoiceDescriptor choice = getEntityManager().find(ChoiceDescriptor.class, choiceId);
        QuestionDescriptor questionDescriptor = choice.getQuestion();
        if (!questionDescriptor.getCbx()) {
            logger.error("ignoreChoice() invoked on a Question which is not of checkbox type");
        }

        Reply reply = this.createReply(choiceId, player, -1L); // Negative startTime: hack to signal ignoration
        try {
            scriptEvent.fire(player, "replyIgnore", new ReplyValidate(reply));
        } catch (WegasScriptException e) {
            // GOTCHA no eventManager is instantiated
            logger.error("EventListener error (\"replySelect\")", e);
        }
        return reply;
    }

    /**
     * create a reply for given player based on given choice
     *
     * @param choiceId  selected choice
     * @param player    player who select the choice
     * @param startTime time the player select the choice
     *
     * @return the new reply
     */
    public Reply selectChoice(Long choiceId, Player player, Long startTime) {
        ChoiceDescriptor choice = getEntityManager().find(ChoiceDescriptor.class, choiceId);
        QuestionDescriptor questionDescriptor = choice.getQuestion();
        QuestionInstance questionInstance = questionDescriptor.getInstance(player);

        requestFacade.getRequestManager().lock("MCQ-" + questionInstance.getId(), questionInstance.getBroadcastTarget());
        //getEntityManager().refresh(questionInstance);
        //requestFacade.getRequestManager().lock("MCQ-" + reply.getQuestionInstance().getId());
        if (questionDescriptor.getCbx() && !questionDescriptor.getAllowMultipleReplies()) {
            // mutually exclusive replies must be cancelled:
            List<Reply> toCancel = new ArrayList<>();
            for (Reply r : questionDescriptor.getInstance(player).getReplies(player)) {
                toCancel.add(r);
            }
            /*
             * Two steps deletion avoids concurrent modification exception 
             */
            for (Reply r : toCancel) {
                this.cancelReply(player.getId(), r.getId());
            }
        }

        Reply reply = this.createReply(choiceId, player, startTime);
        try {
            scriptEvent.fire(player, "replySelect", new ReplyValidate(reply));
        } catch (WegasScriptException e) {
            // GOTCHA no eventManager is instantiated
            logger.error("EventListener error (\"replySelect\")", e);
        }

        return reply;
    }

    /**
     * {@link #selectChoice(java.lang.Long, java.lang.Long, java.lang.Long) selectChoice}
     * with startTime = 0
     *
     * @param choiceId
     * @param playerId
     *
     * @return the new reply
     */
    public Reply selectChoice(Long choiceId, Long playerId) {
        return this.selectChoice(choiceId, playerFacade.find(playerId), (long) 0);
    }

    /**
     * @param choiceId  selected choice id
     * @param playerId  id of player who select the choice
     * @param startTime time the player select the choice
     *
     * @return the new reply
     */
    public Reply selectChoice(Long choiceId, Long playerId, Long startTime) {
        return this.selectChoice(choiceId, playerFacade.find(playerId), startTime);
    }

    /**
     *
     * {@link #selectChoice(java.lang.Long, com.wegas.core.persistence.game.Player, java.lang.Long)  selectChoice} + {@link #validateReply(com.wegas.core.persistence.game.Player, java.lang.Long)  validateReply}
     * in one shot
     *
     * @param choiceId selected choice id
     * @param playerId id of player who select the choice
     *
     * @return the new validated reply
     */
    public Reply selectAndValidateChoice(Long choiceId, Long playerId) {
        Player player = playerFacade.find(playerId);
        Reply reply = this.selectChoice(choiceId, player, (long) 0);
        //try {
        //this.validateReply(player, reply.getId());
        this.validateReply(player, reply);
        //} catch (WegasRuntimeException e) {
        //logger.error("CANCEL REPLY", e);
        //this.cancelReplyTransactional(player, reply.getId());
        //this.cancelReplyTransactional(player, reply);
        //  throw e;
        //}
        return reply;
    }
    
    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public Reply TX_selectAndValidateChoice(Long choiceId, Long playerId) {
        return this.selectAndValidateChoice(choiceId, playerId);
    }
    /**
     *
     * @param player player who wants to cancel the reply
     * @param reply  the reply to cancel
     *
     * @return reply being canceled
     */
    public Reply cancelReplyTransactional(Player player, Reply reply) {
        Reply r = this.internalCancelReply(reply);
        try {
            scriptEvent.fire(player, "replyCancel", new ReplyValidate(r));// Throw an event
        } catch (WegasRuntimeException e) {
            // GOTCHA no eventManager is instantiated
        }
        return reply;
    }

    /**
     *
     * @param player  player who wants to cancel the reply
     * @param replyId id of reply to cancel
     *
     * @return reply being canceled
     */
    public Reply cancelReplyTransactional(Player player, Long replyId) {
        Reply reply = this.internalCancelReply(replyId);
        try {
            scriptEvent.fire(player, "replyCancel", new ReplyValidate(reply));// Throw an event
        } catch (WegasRuntimeException e) {
            // GOTCHA no eventManager is instantiated
        }
        return reply;
    }

    /**
     *
     * @param playerId id of player who wants to cancel the reply
     * @param replyId  id of reply to cancel
     *
     * @return reply being canceled
     */
    public Reply cancelReplyTransactional(Long playerId, Long replyId) {
        Player player = playerFacade.find(playerId);
        return this.cancelReplyTransactional(player, replyId);
    }

    /**
     * @param playerId id of player who wants to cancel the reply
     * @param replyId  id of reply to cancel
     *
     * @return reply being canceled
     */
    public Reply cancelReply(Long playerId, Long replyId) {
        return this.cancelReplyTransactional(playerId, replyId);
    }

    /**
     * @param player
     * @param validateReply
     *
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    public void validateReply(final Player player, final Reply validateReply) throws WegasRuntimeException {
        final ChoiceDescriptor choiceDescriptor = validateReply.getResult().getChoiceDescriptor();
        ChoiceInstance instance = choiceDescriptor.getInstance(player);
        instance.setActive(false);
        validateReply.setResult(choiceDescriptor.getInstance(player).getResult());// Refresh the current result

        if (validateReply.getIgnored()) {
            scriptManager.eval(player, validateReply.getResult().getIgnorationImpact(), choiceDescriptor);
        } else {
            scriptManager.eval(player, validateReply.getResult().getImpact(), choiceDescriptor);
        }
        final ReplyValidate replyValidate = new ReplyValidate(validateReply,
                choiceDescriptor.getInstance(player),
                (QuestionInstance) ((ChoiceDescriptor) validateReply.getChoiceInstance().findDescriptor()).getQuestion().getInstance(player),
                player);
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
     * validates all replies (i.e. selected choices) and processes all other
     * choices as "ignored".
     *
     * @param validateQuestion
     * @param player
     *
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    public void validateQuestion(final QuestionInstance validateQuestion, final Player player) throws WegasRuntimeException {

        final QuestionDescriptor questionDescriptor = (QuestionDescriptor) validateQuestion.getDescriptor();
        if (!questionDescriptor.getCbx()) {
            logger.error("validateQuestion() invoked on a Question which is not of checkbox type");
            return;
        }

        // Don't validate questions with no replies
        if (validateQuestion.getReplies(player).isEmpty()) {
            throw new WegasErrorMessage(WegasErrorMessage.ERROR, "Please select a reply");
        }

        // Loop on all choices: validate all replies (checked choices) and "ignore" all unchecked choices.
        // NB: there should be only one reply per choice for each player.
        for (ChoiceDescriptor choice : questionDescriptor.getItems()) {
            // Test if the current choice has been selected, i.e. there is a reply for it.
            ChoiceInstance choiceInstance = choice.getInstance(player);
            boolean found = false;
            for (Reply r : choiceInstance.getReplies()) {
                if (!r.getIgnored()) {
                    // It's been selected: validate the reply (which executes the impact)
                    this.validateReply(player, r);
                } else {
                    logger.error("validateQuestion() invoked on a Question where ignored replies are already persisted");
                }
                found = true;
                break;
            }
            if (!found) {
                Reply ignoredReply = ignoreChoice(choice.getId(), player);
                this.validateReply(player, ignoredReply);
            }
        }

        //getEntityManager().refresh(validateQuestion);
        validateQuestion.setValidated(true);
        //getEntityManager().flush();
    }

    /**
     * @param questionInstanceId
     * @param player
     */
    public void validateQuestion(Long questionInstanceId, Player player) {
        QuestionInstance questionInstance = getEntityManager().find(QuestionInstance.class, questionInstanceId);
        requestFacade.getRequestManager().lock("MCQ-" + questionInstance.getId(), questionInstance.getBroadcastTarget());
        this.validateQuestion(questionInstance, player);
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

    /**
     * @return looked-up EJB
     */
    public static QuestionDescriptorFacade lookup() {
        try {
            return Helper.lookupBy(QuestionDescriptorFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving var inst f", ex);
            return null;
        }
    }
}
