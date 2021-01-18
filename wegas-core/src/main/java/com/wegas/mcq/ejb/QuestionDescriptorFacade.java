
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.ejb;

import com.wegas.core.Helper;
import com.wegas.core.api.QuestionDescriptorFacadeI;
import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.ScriptEventFacade;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.PrimitiveDescriptorI;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.log.xapi.Xapi;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.ReadableInstance;
import com.wegas.mcq.persistence.Reply;
import com.wegas.mcq.persistence.Result;
import com.wegas.mcq.persistence.wh.WhQuestionDescriptor;
import com.wegas.mcq.persistence.wh.WhQuestionInstance;
import com.wegas.messaging.persistence.Message;
import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedList;
import java.util.List;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.ejb.TransactionAttribute;
import javax.ejb.TransactionAttributeType;
import javax.inject.Inject;
import javax.persistence.TypedQuery;
import org.graalvm.polyglot.Value;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class QuestionDescriptorFacade extends BaseFacade<ChoiceDescriptor> implements QuestionDescriptorFacadeI {

    static final private Logger logger = LoggerFactory.getLogger(QuestionDescriptorFacade.class);

    /**
     *
     */
    @Inject
    private PlayerFacade playerFacade;

    /**
     *
     */
    @Inject
    private ScriptFacade scriptManager;

    /**
     *
     */
    @Inject
    private RequestFacade requestFacade;

    /**
     *
     * @Inject QuestionSingleton questionSingleton;
     */
    /**
     *
     */
    @Inject
    private ScriptEventFacade scriptEvent;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    @Inject
    private Xapi xapi;

    /**
     * Find a result identified by the given name belonging to the given descriptor
     *
     * @param choiceDescriptor
     * @param name
     *
     * @return the given ChoiceDescriptor Result that matches the name
     *
     * @throws WegasNoResultException if not found
     */
    public Result findResult(final ChoiceDescriptor choiceDescriptor, final String name) throws WegasNoResultException {
        //if (!Helper.isNullOrEmpty(name)) {
        if (name != null) {
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

    public Result findResult(Long id) {
        return this.getEntityManager().find(Result.class, id);
    }

    /**
     * Fetch all ChoiceInstance which have result as currentResult
     *
     * @param result
     *
     * @return
     */
    public Collection<ChoiceInstance> getChoiceInstancesByResult(Result result) {
        TypedQuery<ChoiceInstance> query = this.getEntityManager().createNamedQuery("ChoiceInstance.findByResultId", ChoiceInstance.class);
        query.setParameter("resultId", result.getId());

        return query.getResultList();
    }

    /**
     * Manually cascade result deletion to replies which references the result
     *
     * @param result
     */
    public void cascadeDelete(Result result) {
        TypedQuery<Reply> query = this.getEntityManager().createNamedQuery("Reply.findByResultId", Reply.class);
        query.setParameter("resultId", result.getId());
        List<Reply> repliesToRemove = query.getResultList();
        for (Reply r : repliesToRemove) {
            this.getEntityManager().remove(r);
        }
    }

    public ReadableInstance readQuestion(Long playerId, Long qdId) {
        VariableDescriptor desc = variableDescriptorFacade.find(qdId);

        ReadableInstance instance = (ReadableInstance) variableDescriptorFacade.getInstance(desc, playerFacade.find(playerId));

        instance.setUnread(false);

        return instance;
    }

    public List<ChoiceInstance> readChoices(Long playerId, List<Long> choiceDescIds) {
        List<ChoiceInstance> instances = new LinkedList<>();
        Player player = playerFacade.find(playerId);

        for (Long id : choiceDescIds) {
            ChoiceDescriptor find = this.find(id);
            ChoiceInstance ci = (ChoiceInstance) variableDescriptorFacade.getInstance(find, player);
            ci.setUnread(Boolean.FALSE);
            instances.add(ci);
        }

        return instances;
    }

    public void reviveChoiceInstance(ChoiceInstance choiceInstance) {
        ChoiceDescriptor choice = (ChoiceDescriptor) choiceInstance.findDescriptor();

        if (!Helper.isNullOrEmpty(choiceInstance.getCurrentResultName())) {
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
                //result.addReply(r);
                r.setResult(result);
            } catch (WegasNoResultException ex) {
                logger.error("NO SUCH RESULT (choiceinstance:{}, reply:{}, resulttName:{}) ", choiceInstance, r, r.getResultName());
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
    @Override
    public Reply updateReply(Long replyId, Reply r) {
        final Reply oldEntity = this.findReply(replyId);
        oldEntity.merge(r);
        return oldEntity;
    }

    private Reply createReply(Long choiceId, Player player, Long startTime, boolean ignored) {
        ChoiceDescriptor choice = (ChoiceDescriptor) variableDescriptorFacade.find(choiceId);
        return this.createReply(choice, player, startTime, ignored);
    }

    private Reply createReply(ChoiceDescriptor choice, Player player, Long startTime, boolean ignored) {
        ChoiceInstance choiceInstance = (ChoiceInstance) variableDescriptorFacade.getInstance(choice, player);

        QuestionDescriptor questionDescriptor = choice.getQuestion();
        QuestionInstance questionInstance = (QuestionInstance) variableDescriptorFacade.getInstance(questionDescriptor, player);

        Boolean isCbx = questionDescriptor.getCbx();
        if (!isCbx
            && questionDescriptor.getMaxReplies() != null
            && questionInstance.getReplies(player).size() >= questionDescriptor.getMaxReplies()) {
            //if (questionDescriptor.getMaxReplies() == 1) { } else {}; specific message ???
            throw WegasErrorMessage.error("You have already answered this question");
        }

        Reply reply = new Reply();
        if (isCbx && ignored) {
            reply.setStartTime(0L);
            reply.setIgnored(true);
        } else {
            reply.setStartTime(startTime);
        }
        Result result = choice.getInstance(player).getResult();
        //result.addReply(reply);
        reply.setResult(result);
        choiceInstance.addReply(reply);
        this.getEntityManager().persist(reply);
//        em.flush();
        return reply;
    }

    public QuestionInstance getQuestionInstanceFromReply(Reply reply) {
        QuestionDescriptor findDescriptor = ((ChoiceDescriptor) reply.getChoiceInstance().findDescriptor()).getQuestion();
        return findDescriptor.findInstance(reply.getChoiceInstance(), requestManager.getCurrentUser());
    }

    /**
     * @param playerId id of player who wants to cancel the reply
     * @param replyId  id of reply to cancel
     *
     * @return reply being cancelled
     */
    private Reply internalCancelReply(Long replyId) {
        final Reply reply = this.getEntityManager().find(Reply.class, replyId);
        QuestionInstance questionInstance = this.getQuestionInstanceFromReply(reply);
        requestFacade.getRequestManager().lock("MCQ-" + questionInstance.getId(), questionInstance.getEffectiveOwner());
        return this.internalCancelReply(reply);
    }

    private Reply internalCancelReply(Reply reply) {
        if (!reply.isValidated()) {
            this.getEntityManager().remove(reply);
            return reply;
        } else {
            throw WegasErrorMessage.error("Cannot cancel a validated reply");
        }
    }

    /**
     * Create an ignoration Reply
     *
     * @param choiceId
     * @param player
     *
     * @return new reply
     */
    @Override
    public Reply ignoreChoice(Long choiceId, Player player) {

        ChoiceDescriptor choice = getEntityManager().find(ChoiceDescriptor.class, choiceId);
        QuestionDescriptor questionDescriptor = choice.getQuestion();
        if (!questionDescriptor.getCbx()) {
            logger.error("ignoreChoice() invoked on a Question which is not of checkbox type");
        }

        Reply reply = this.createReply(choiceId, player, -1L, true);
        try {
            scriptEvent.fire(player, "replyIgnore", new ReplyValidate(reply));
        } catch (WegasScriptException e) {
            // GOTCHA no eventManager is instantiated
            logger.error("EventListener error (\"replySelect\")", e);
        }
        return reply;
    }

    /**
     * create a reply for given player based on given choice.
     * <p>
     * Pre existing not validated reply will be cancelled if the question accept one reply only.
     *
     * @param choiceId  selected choice
     * @param player    player who select the choice
     * @param startTime time the player select the choice
     * @param quiet     a quiet selectChoice do not send any lock to others users and do not fire
     *                  any replySelect event
     *
     * @return the new reply
     *
     * @throws WegasErrorMessage if the question is fully validated or the maximum number of replies
     *                           has been reached
     */
    @Override
    public Reply selectChoice(Long choiceId, Player player, Long startTime, boolean quiet)
        throws WegasErrorMessage {
        ChoiceDescriptor choice = getEntityManager().find(ChoiceDescriptor.class, choiceId);
        return this.selectChoice(choice, player, startTime, quiet);
    }

    /**
     * create a reply for given player based on given choice.
     * <p>
     * Pre existing not validated reply will be cancelled if the question accept one reply only.
     *
     * @param choice    selected choice
     * @param player    player who select the choice
     * @param startTime time the player select the choice
     * @param quiet     a quiet selectChoice do not send any lock to others users and do not fire
     *                  any replySelect event
     *
     * @return the new reply
     *
     * @throws WegasErrorMessage if the question is fully validated or the maximum number of replies
     *                           has been reached
     */
    public Reply selectChoice(ChoiceDescriptor choice, Player player, Long startTime, boolean quiet)
        throws WegasErrorMessage {
        QuestionDescriptor questionDescriptor = choice.getQuestion();
        QuestionInstance questionInstance = questionDescriptor.getInstance(player);

        if (questionInstance.isValidated()) {
            throw WegasErrorMessage.error("This question has already been validated/discarded");
        }

        if (!quiet) {
            requestFacade.getRequestManager().lock("MCQ-" + questionInstance.getId(), questionInstance.getEffectiveOwner());
        }

        Integer maxQ = questionDescriptor.getMaxReplies();
        Integer maxC;
        if (questionDescriptor.getCbx()) {
            maxC = 1;
        } else {
            maxC = choice.getMaxReplies();
        }

        // radio-like checkbox ?
        if (questionDescriptor.getCbx() && maxQ != null && maxQ == 1) {

            // mutually exclusive replies must be cancelled:
            List<Reply> toCancel = new ArrayList<>();
            for (Reply r : questionInstance.getReplies(player)) {
                toCancel.add(r);
            }

            /* Two steps deletion avoids concurrent modification exception */
            for (Reply r : toCancel) {
                this.cancelReply(player.getId(), r.getId());
            }
        }

        /**
         * Could not create a new reply if the maximum number has already been reached for the whole
         * question
         */
        List<Reply> replies = questionInstance.getReplies(player);
        if (maxQ != null && replies.size() >= maxQ) {
            throw WegasErrorMessage.error("You can select up to " + maxQ + " answers" + (maxQ > 1 ? "s" : ""));
        }

        /**
         * Could not create a new reply if the maximum number has already been reached for the
         * specific choice
         */
        List<Reply> cReplies = choice.getInstance(player).getReplies();
        if (maxC != null && cReplies.size() >= maxC) {
            throw WegasErrorMessage.error("You can not select this choice more than " + maxC + " time" + (maxC > 1 ? "s" : ""));
        }

        Reply reply = this.createReply(choice, player, startTime, false);

        if (!quiet) {
            try {
                scriptEvent.fire(player, "replySelect", new ReplyValidate(reply));
            } catch (WegasScriptException e) {
                // GOTCHA no eventManager is instantiated
                logger.error("EventListener error (\"replySelect\")", e);
            }
        }

        return reply;
    }

    /**
     * {@link #selectChoice(java.lang.Long, java.lang.Long, java.lang.Long) selectChoice} with
     * startTime = 0
     *
     * @param choiceId
     * @param playerId
     *
     * @return the new reply
     */
    @Override
    public Reply selectChoice(Long choiceId, Long playerId
    ) {
        return this.selectChoice(choiceId, playerFacade.find(playerId), 0l, false);
    }

    /**
     * @param choiceId  selected choice id
     * @param playerId  id of player who select the choice
     * @param startTime time the player select the choice
     *
     * @return the new reply
     */
    @Override
    public Reply selectChoice(Long choiceId, Long playerId,
        Long startTime
    ) {
        return this.selectChoice(choiceId, playerFacade.find(playerId), startTime, false);
    }

    /**
     * {@link #selectChoice(java.lang.Long, java.lang.Long, java.lang.Long) selectChoice} with
     * startTime = 0
     *
     * @param choiceId
     * @param player
     * @param startTime
     *
     * @return the new reply
     */
    @Override
    public Reply deselectOthersAndSelectChoice(Long choiceId, Player player, Long startTime) {
        ChoiceDescriptor choice = getEntityManager().find(ChoiceDescriptor.class, choiceId);
        QuestionDescriptor questionDescriptor = choice.getQuestion();
        QuestionInstance questionInstance = questionDescriptor.getInstance(player);

        List<Reply> pendingReplies = questionInstance.getReplies(player, Boolean.FALSE);
        for (Reply r : pendingReplies) {
            this.internalCancelReply(r);
            //this.cancelReplyTransactional(player, r);
        }

        return this.selectChoice(choiceId, player, startTime, true);
    }

    /**
     * @param choiceId  selected choice id
     * @param playerId  id of player who select the choice
     * @param startTime
     *
     * @return the new reply
     */
    @Override
    public Reply deselectOthersAndSelectChoice(Long choiceId, Long playerId, Long startTime) {
        return this.deselectOthersAndSelectChoice(choiceId, playerFacade.find(playerId), startTime);
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
    @Override
    public Reply selectAndValidateChoice(Long choiceId, Long playerId) {
        return selectAndValidateChoice(
            (ChoiceDescriptor) variableDescriptorFacade.find(choiceId),
            playerFacade.find(playerId));
    }

    /**
     *
     * {@link #selectChoice(java.lang.Long, com.wegas.core.persistence.game.Player, java.lang.Long)  selectChoice} + {@link #validateReply(com.wegas.core.persistence.game.Player, java.lang.Long)  validateReply}
     * in one shot
     *
     * @param choiceName selected choice name
     * @param self       the player who select the choice
     *
     * @return the new validated reply
     */
    @Override
    public Reply selectAndValidateChoiceName(String choiceName, Player self) {
        try {
            return this.selectAndValidateChoice(
                (ChoiceDescriptor) variableDescriptorFacade.find(
                    self.getGameModel(), choiceName),
                self);
        } catch (WegasNoResultException ex) {
            throw WegasErrorMessage.error("Choice not found");
        }
    }

    private Reply selectAndValidateChoice(ChoiceDescriptor choice, Player self) {
        Reply reply = this.selectChoice(choice, self, 0l, false);
        this.validateReply(self, reply);
        return reply;
    }

    @TransactionAttribute(TransactionAttributeType.REQUIRES_NEW)
    public Reply selectAndValidateChoiceTx(Long choiceId, Long playerId) {
        return this.selectAndValidateChoice(choiceId, playerId);
    }

    /**
     *
     * @param player player who wants to cancel the reply
     * @param reply  the reply to cancel
     *
     * @return reply being cancelled
     */
    public Reply cancelReplyTransactional(Player player, Reply reply) {
        Reply r = this.internalCancelReply(reply);
        try {
            scriptEvent.fire(player, "replyCancel", new ReplyValidate(r));// Throw an event
        } catch (WegasRuntimeException e) {
            logger.trace("Fails to fire replyCancel event: {}", e);
        }
        return reply;
    }

    /**
     *
     * @param player  player who wants to cancel the reply
     * @param replyId id of reply to cancel
     *
     * @return reply being cancelled
     */
    public Reply cancelReplyTransactional(Player player, Long replyId) {
        Reply reply = this.internalCancelReply(replyId);
        try {
            scriptEvent.fire(player, "replyCancel", new ReplyValidate(reply));// Throw an event
        } catch (WegasRuntimeException e) {
            logger.trace("Fails to fire replyCancel event: {}", e);
        }
        return reply;
    }

    /**
     *
     * @param playerId id of player who wants to cancel the reply
     * @param replyId  id of reply to cancel
     *
     * @return reply being cancelled
     */
    public Reply cancelReplyTransactional(Long playerId, Long replyId) {
        Player player = playerFacade.find(playerId);
        return this.cancelReplyTransactional(player, replyId);
    }

    /**
     * @param playerId id of player who wants to cancel the reply
     * @param replyId  id of reply to cancel
     *
     * @return reply being cancelled
     */
    @Override
    public Reply cancelReply(Long playerId, Long replyId) {
        return this.cancelReplyTransactional(playerId, replyId);
    }

    /**
     * @param playerId id of player who wants to cancel the reply
     * @param replyId  id of reply to cancel
     *
     * @return reply being cancelled
     */
    public Reply quietCancelReply(Long playerId, Long replyId) {
        return this.internalCancelReply(replyId);
    }

    /**
     * @param player
     * @param reply
     *
     * @throws WegasRuntimeException
     */
    @Override
    public Reply validateReply(final Player player, final Reply reply) throws WegasRuntimeException {
        if (!reply.isValidated()) {
            reply.setValidated(true);

            final ChoiceDescriptor choiceDescriptor = reply.getResult().getChoiceDescriptor();
            reply.setResult(choiceDescriptor.getInstance(player).getResult());// Refresh the current result

            if (reply.getIgnored()) {
                scriptManager.eval(player, reply.getResult().getIgnorationImpact(), choiceDescriptor);
            } else {
                scriptManager.eval(player, reply.getResult().getImpact(), choiceDescriptor);
            }
            ChoiceInstance choiceInstance = reply.getChoiceInstance();

            final ReplyValidate replyV = new ReplyValidate(reply, choiceInstance,
                (QuestionInstance) choiceDescriptor.getQuestion().getInstance(player),
                player);
            try {
                if (reply.getIgnored()) {
                    scriptEvent.fire(player, "replyIgnore", replyV);
                } else {
                    scriptEvent.fire(player, "replyValidate", replyV);
                }
            } catch (WegasRuntimeException e) {
                logger.error("EventListener error (\"replyValidate\")", e);
                // GOTCHA no eventManager is instantiated
            }
            xapi.replyValidate(replyV);
            return reply;
        } else {
            throw WegasErrorMessage.error("This reply has already been validated");
        }
    }

    /**
     * @param player
     * @param replyVariableInstanceId
     */
    @Override
    public Reply validateReply(Player player, Long replyVariableInstanceId) {
        return this.validateReply(player, getEntityManager().find(Reply.class, replyVariableInstanceId));
    }

    /**
     * @param playerId
     * @param replyVariableInstanceId
     */
    @Override
    public Reply validateReply(Long playerId, Long replyVariableInstanceId) {
        return this.validateReply(playerFacade.find(playerId), replyVariableInstanceId);
    }

    public void validateQuestion(final VariableInstance question, final Player player) throws WegasRuntimeException {
        if (question instanceof QuestionInstance) {
            this.validateQuestion((QuestionInstance) question, player);
        } else if (question instanceof WhQuestionInstance) {
            this.validateQuestion((WhQuestionInstance) question, player);
        }
    }

    @Override
    public void validateQuestion(final WhQuestionInstance validateQuestion, final Player player) throws WegasRuntimeException {
        validateQuestion.setValidated(true);
        WhValidate whVal = new WhValidate(validateQuestion, player);
        scriptEvent.fire(player, "whValidate", whVal);

        xapi.whValidate(whVal, player);
    }

    /**
     * Validates a question that's marked as checkbox type: sequentially validates all replies (i.e.
     * selected choices) and processes all other choices as "ignored".
     *
     * @param validateQuestion
     * @param player
     *
     * @throws com.wegas.core.exception.client.WegasRuntimeException
     */
    @Override
    public void validateQuestion(final QuestionInstance validateQuestion, final Player player) throws WegasRuntimeException {

        final QuestionDescriptor questionDescriptor = (QuestionDescriptor) validateQuestion.getDescriptor();
        if (!questionDescriptor.getCbx()) {
            logger.error("validateQuestion() invoked on a Question which is not of checkbox type");
            return;
        }

        QuestionInstance questionInstance = (QuestionInstance) variableDescriptorFacade.getInstance(questionDescriptor, player);

        if (questionInstance.isValidated()) {
            throw WegasErrorMessage.error("This question has already been validated/discarded");
        }

        int min = questionDescriptor.getMinReplies() != null ? questionDescriptor.getMinReplies() : 1;
        Integer max = questionDescriptor.getMaxReplies();

        List<Reply> replies = validateQuestion.getReplies(player);

        // not enough replies
        if (replies.size() < min) {
            if (min == 1) {
                throw WegasErrorMessage.error("Please select a reply");
            } else {
                throw WegasErrorMessage.error("Please select at least " + min + " replies");
            }
        }

        // too many replies
        if (max != null && replies.size() > max) {
            // note that this case should be unreachable since #selectChoice prenvent select too much choices...
            throw WegasErrorMessage.error("You can not select more than " + max + (max == 1 ? "reply" : "replies"));
        }

        // Loop on all choices: validate all replies (checked choices) and "ignore" all unchecked choices.
        // NB: there should be only one reply per choice for each player.
        for (ChoiceDescriptor choice : questionDescriptor.getItems()) {
            // Test if the current choice has been selected, i.e. there is a reply for it.
            ChoiceInstance choiceInstance = choice.getInstance(player);

            List<Reply> choiceReplies = choiceInstance.getReplies();

            if (choiceReplies.size() > 1) {
                logger.error("validateQuestion() too many replies in the choice {}", choiceInstance);
                // TODO should throw error ?
            }

            if (!choiceReplies.isEmpty()) {
                Reply r = choiceReplies.get(0);

                if (!r.getIgnored()) {
                    // It's been selected: validate the reply (which executes the impact)
                    this.validateReply(player, r);
                } else {
                    logger.error("validateQuestion() invoked on a Question where ignored replies are already persisted");
                    // TODO should throw error ?
                }
            } else {
                Reply ignoredReply = ignoreChoice(choice.getId(), player);
                this.validateReply(player, ignoredReply);
            }
        }

        //getEntityManager().refresh(validateQuestion);
        validateQuestion.setValidated(true);

        ReplyValidate qValidate = new ReplyValidate(null, null, validateQuestion, player);
        scriptEvent.fire(player, "replyValidate", qValidate);
        //getEntityManager().flush();
    }

    /**
     * @param questionInstanceId
     * @param player
     */
    @Override
    public void validateQuestion(Long questionInstanceId, Player player) {
        VariableInstance question = getEntityManager().find(VariableInstance.class, questionInstanceId);
        requestFacade.getRequestManager().lock("MCQ-" + question.getId(), question.getEffectiveOwner());
        this.validateQuestion(question, player);
    }

    /**
     * @param questionInstanceId
     * @param playerId
     */
    @Override
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
     * @param self       current player
     * @param whValidate whValidate script event
     * @param i18n       to fetch some translations
     *
     * @return
     */
    @Override
    public Message buildWhValidateMessage(Player self, WhValidate whValidate, Value i18n) {
        Message history = new Message();

        TranslatableContent from = new TranslatableContent();
        TranslatableContent subject = new TranslatableContent();
        TranslatableContent body = new TranslatableContent();
        TranslatableContent date = new TranslatableContent();

        GameModel gameModel = whValidate.whDescriptor.getGameModel();
        for (GameModelLanguage language : gameModel.getRawLanguages()) {
            String code = language.getCode();

            String title = whValidate.whDescriptor.getLabel().translateOrEmpty(gameModel, code);
            String description = whValidate.whDescriptor.getDescription().translateOrEmpty(gameModel, code);

            StringBuilder bd = new StringBuilder();
            bd.append("<div class=\"whquestion-history\">")
                .append("<div class=\"whquestion-label\">").append(title).append("</div>")
                .append(description);

            for (VariableDescriptor item : whValidate.whDescriptor.getItems()) {
                if (item instanceof PrimitiveDescriptorI) {
                    bd.append("<div class=\"whview-history-answer\">")
                        .append("<div class=\"whview-history-answer-title\">").
                        append(item.getLabel().translateOrEmpty(gameModel, code)).
                        append("</div>");

                    if (item instanceof StringDescriptor && !((StringDescriptor) item).getAllowedValues().isEmpty()) {
                        StringInstance instance = (StringInstance) item.getInstance(self);
                        String[] values = instance.parseValues(instance.getValue());
                        for (String value : values) {
                            bd.append("<div class=\"whview-history-answer-value\" style=\"margin-left : 10px;\">").
                                append(value).
                                append("</div>");
                        }

                    } else {
                        Object value = ((PrimitiveDescriptorI) item).getValue(self);

                        bd.append("<div class=\"whview-history-answer-value\" style=\"margin-left : 10px;\">").
                            append(value).
                            append("</div>");
                    }

                    bd.append("</div>");
                }
            }
            bd.append("</div>");

            subject.updateTranslation(code, title);
            body.updateTranslation(code, bd.toString());
        }

        history.setFrom(from);
        history.setSubject(subject);
        history.setBody(body);
        history.setDate(date);

        return history;
    }

    public static class WhValidate {

        final public WhQuestionDescriptor whDescriptor;
        final public WhQuestionInstance whInstance;

        final public Player player;

        private WhValidate(WhQuestionInstance validateQuestion, Player player) {
            this.whInstance = validateQuestion;
            this.whDescriptor = (WhQuestionDescriptor) validateQuestion.findDescriptor();
            this.player = player;
        }
    }

    private Value getConfig(Value config, String key, Object defaultValue) {
        Value value = config.getMember(key);
        if (value == null || value.isNull()) {
            return Value.asValue(defaultValue);
        }
        return value;
    }

    private void appendChoice(StringBuilder sb, ChoiceInstance ci, GameModel gameModel, String code, String labelPrefix) {
        ChoiceDescriptor cd = (ChoiceDescriptor) ci.getDescriptor();
        String title = cd.getLabel().translateOrEmpty(gameModel, code);
        if (!Helper.isNullOrEmpty(title)) {
            sb.append("<div class=\"choice-label\">");
            if (labelPrefix != null) {
                sb.append(labelPrefix);
            }
            sb.append(title).append("</div>");
        }

        String description = cd.getDescription().translateOrEmpty(gameModel, code);
        if (!Helper.isNullOrEmpty(description)) {
            sb.append("<div class=\"choice-description\">").append(description).append("</div>");
        }
    }

    /**
     *
     * @param self          current player
     * @param replyValidate
     * @param i18n          to fetch some translations
     * @param config        options : { showQuestion:boolean, showReplies:boolean}
     *
     * @return
     */
    @Override
    public Message buildReplyValidateMessage(Player self, ReplyValidate replyValidate, Value i18n, Value config) {
        QuestionInstance qi = replyValidate.question;
        QuestionDescriptor qd = (QuestionDescriptor) qi.getDescriptor();
        ChoiceInstance ci = replyValidate.choice;

        boolean isCbx = false;
        if (qd.getCbx()) {
            if (ci != null) {
                // skip cbx question's individual replyValidate, wait for the global one (the one with neigher a choice nor a reply)
                return null;
            } else {
                isCbx = true;
            }
        }

        Message history = new Message();

        Boolean showQuestion = this.getConfig(config, "showQuestion", true).asBoolean();
        Boolean showReplies = this.getConfig(config, "showReplies", true).asBoolean();

        TranslatableContent from = new TranslatableContent();
        TranslatableContent subject = new TranslatableContent();
        TranslatableContent body = new TranslatableContent();
        TranslatableContent date = new TranslatableContent();

        GameModel gameModel = replyValidate.player.getGameModel();

        for (GameModelLanguage language : gameModel.getRawLanguages()) {
            String code = language.getCode();

            StringBuilder bd = new StringBuilder();
            bd.append("<div class=\"question-history\">");
            String qTitle = qd.getLabel().translateOrEmpty(gameModel, code);

            if (showQuestion) {
                String description = qd.getDescription().translateOrEmpty(gameModel, code);

                bd.append("<div class=\"question-label\">").append(qTitle).append("</div>");
                bd.append("<div class=\"question-description\">").append(description).append("</div>");
            }

            if (!isCbx) {
                if (ci != null) {
                    this.appendChoice(bd, ci, gameModel, code, null);
                }

                if (showReplies) {
                    List<Reply> replies = qi.getSortedReplies(self);
                    String title;
                    if (replies.size() > 1) {
                        title = i18n.invokeMember("t", "question.results", null, code).asString();
                    } else {
                        title = i18n.invokeMember("t", "question.result", null, code).asString();
                    }
                    bd.append("<div class=\"replies-label\">").append(title).append("</div>");
                    bd.append("<div class=\"replies\">");
                    for (Reply reply : replies) {
                        bd.append("<div class=\"replyDiv\">");
                        bd.append(reply.getAnswer().translateOrEmpty(gameModel, code));
                        bd.append("</div>");
                    }
                    bd.append("</div>");
                }
            } else {
                List<Reply> replies = qi.getReplies(self);
                String title;
                if (replies.size() > 1) {
                    title = i18n.invokeMember("t", "question.results", null, code).asString();
                } else {
                    title = i18n.invokeMember("t", "question.result", null, code).asString();
                }
                bd.append("<div class=\"replies-label\">").append(title).append("</div>");
                bd.append("<div class=\"cbx-replies\">");

                for (Reply reply : replies) {
                    Boolean ignored = reply.getIgnored();
                    bd.append("<div class=\"replyDiv ").append(ignored ? "ignored" : "selected").append(" \">");
                    this.appendChoice(bd, reply.getChoiceInstance(), gameModel, code,
                        "<input type='checkbox' disabled " + (ignored ? "" : "checked") + " />");
                    TranslatableContent trAnswer = ignored ? reply.getIgnorationAnswer() : reply.getAnswer();
                    if (trAnswer != null) {
                        bd.append("<div class='reply-answer'>");
                        String answer = trAnswer.translateOrEmpty(gameModel, code);
                        bd.append(answer);
                        bd.append("</div>");
                    }
                    bd.append("</div>");
                }
                bd.append("</div>");
            }

            bd.append("</div>"); // end question-history

            subject.updateTranslation(code, qTitle);
            body.updateTranslation(code, bd.toString());

        }

        history.setFrom(from);
        history.setSubject(subject);
        history.setBody(body);
        history.setDate(date);

        return history;
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
         * Fox cbx question only !
         *
         * @param question
         * @param player
         */
        public ReplyValidate(QuestionInstance question, Player player) {
            this.reply = null;
            this.choice = null;
            this.question = question;
            this.player = player;
        }

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
