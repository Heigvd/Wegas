/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.ejb;

import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.ScriptEventFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.event.internal.DescriptorRevivedEvent;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.reviewing.persistence.PeerReviewInstance;
import com.wegas.reviewing.persistence.Review;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationInstance;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Stateless
@LocalBean
public class ReviewingFacade {

    static final private Logger logger = LoggerFactory.getLogger(ReviewingFacade.class);
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public ReviewingFacade() {
    }
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    /**
     *
     */
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @Inject
    private ScriptEventFacade scriptEvent;

    public Review findReview(final Long entityId) {
        return em.find(Review.class, entityId);
    }

    public EvaluationInstance findEvaluationInstance(Long evId) {
        return em.find(EvaluationInstance.class, evId);
    }

    public void submit(PeerReviewDescriptor prd, Player p) {
        PeerReviewInstance instance = prd.getInstance(p);
        if (instance.getReviewState() == PeerReviewDescriptor.ReviewingState.NOT_STARTED || instance.getReviewState() == PeerReviewDescriptor.ReviewingState.SUBMITTED) {
            instance.setReviewState(PeerReviewDescriptor.ReviewingState.SUBMITTED);
        } else {
            throw WegasErrorMessage.error("Error: already submitted");
        }
    }

    public void submit(Long peerReviewDescriptorId, Long playerId) {
        VariableDescriptor vd = variableDescriptorFacade.find(peerReviewDescriptorId);
        if (vd instanceof PeerReviewDescriptor) {
            submit((PeerReviewDescriptor) vd, playerFacade.find(playerId));
        } else {
            throw WegasErrorMessage.error("Submit failed: Descriptor is not instance of PeerReviewDescriptor");
        }
    }

    private Review createReview(PeerReviewDescriptor prd, PeerReviewInstance author, PeerReviewInstance reviewer) {
        Review r = new Review();
        r.setStatus(Review.ReviewState.DISPATCHED);
        r.setAuthor(author);
        r.setReviewer(reviewer);
        for (EvaluationDescriptor ed : prd.getFeedback().getEvaluations()) {
            EvaluationInstance ei = ed.createInstance();
            ei.setFeedbackReview(r);
            r.getFeedback().add(ei);
        }
        for (EvaluationDescriptor ed : prd.getFeedbackEvaluation().getEvaluations()) {
            EvaluationInstance ei = ed.createInstance();
            ei.setFeedbackEvaluationReview(r);
            r.getFeedbackEvaluation().add(ei);
        }
        return r;
    }

    public void dispatch(PeerReviewDescriptor prd) {
        List<PeerReviewInstance> pris = new ArrayList(prd.getScope().getVariableInstances().values());

        // Todo: evict dispatched instances and those belonging to such a DebugGame/TestPlayer
        Collections.shuffle(pris);

        int numberOfReview = Math.max(1, Math.min(prd.getMaxNumberOfReview(), (int) Math.floor(0.5 * (pris.size() - 1))));
        int i, j;
        for (i = 0; i < pris.size(); i++) {
            PeerReviewInstance author = pris.get(i);
            if (author.getReviewState() == PeerReviewDescriptor.ReviewingState.SUBMITTED
                    || author.getReviewState() == PeerReviewDescriptor.ReviewingState.NOT_STARTED) {
                logger.warn("Dispatch Author");
                List<Review> reviewed = author.getReviewed();
                for (j = 1; j <= numberOfReview; j++) {
                    PeerReviewInstance reviewer = pris.get((i + j) % pris.size());
                    Review r = createReview(prd, author, reviewer);
                    reviewed.add(r);
                    reviewer.getToReview().add(r);
                }
                author.setReviewState(PeerReviewDescriptor.ReviewingState.DISPATCHED);
                variableInstanceFacade.merge(author);
                em.flush();
            }
        }
    }

    public void dispatch(Long peerReviewDescriptorId) {
        VariableDescriptor vd = variableDescriptorFacade.find(peerReviewDescriptorId);
        if (vd instanceof PeerReviewDescriptor) {
            dispatch((PeerReviewDescriptor) vd);
        } else {
            throw WegasErrorMessage.error("Submit failed: Descriptor is not instance of PeerReviewDescriptor");
        }
    }

    public void mergeEval(EvaluationInstance evalInstance, EvaluationInstance other) {
        evalInstance.merge(other);
        Review review = evalInstance.getEffectiveReview();
        PeerReviewInstance author = review.getAuthor();
        PeerReviewInstance reviewer = review.getReviewer();
        em.merge(author);
        em.merge(reviewer);
    }

    public void submitReview(Review review) {
        if (review.getStatus() == Review.ReviewState.DISPATCHED) {
            review.setStatus(Review.ReviewState.REVIEWED);
        }
    }

    public void submitReview(Long reviewId) {
        this.submitReview(em.find(Review.class, reviewId));
    }

    public void notify(PeerReviewDescriptor prd) {
        List<PeerReviewInstance> pris = new ArrayList(prd.getScope().getVariableInstances().values());
        for (PeerReviewInstance pri : pris) {
            for (Review review : pri.getReviewed()) {
                if (review.getStatus() == Review.ReviewState.DISPATCHED || review.getStatus() == Review.ReviewState.REVIEWED) {
                    review.setStatus(Review.ReviewState.NOTIFIED);
                }
            }
            variableInstanceFacade.merge(pri);
        }
    }

    /**
     * Reviewing phase is over -> author will be able to see feedbacks
     *
     * @param peerReviewDescriptorId
     */
    public void notify(Long peerReviewDescriptorId) {
        VariableDescriptor vd = variableDescriptorFacade.find(peerReviewDescriptorId);
        if (vd instanceof PeerReviewDescriptor) {
            notify((PeerReviewDescriptor) vd);
        } else {
            throw WegasErrorMessage.error("Notify failed: Descriptor is not instance of PeerReviewDescriptor");
        }
    }

    /**
     * Since PeerReviewDescriptor toReview variable is only referenced by its
     * own private name on the JSON side, we have to resolve those name to
     * effective VariableDescriptor
     *
     * Moreover, as the variable may not yet exists (especially when posting a
     * whole GameModel) when the PeerReviewDescriptor is created, we'll have to
     * wait to resolve such identifier.
     *
     * This is done by listening to DescriptorRevivedEvent
     *
     * @param event
     */
    public void descriptorRevivedEvent(@Observes DescriptorRevivedEvent event) {
        if (event.getEntity() instanceof PeerReviewDescriptor) {
            logger.debug("Received DescriptorRevivedEvent event");
            PeerReviewDescriptor reviewD = (PeerReviewDescriptor) event.getEntity();
            try {
                reviewD.setToReview(variableDescriptorFacade.find(reviewD.getGameModel(), reviewD.getImportedToReviewName()));
            } catch (WegasNoResultException ex) {
                reviewD.setToReview(null);
                logger.error("Failed te revive ReviewDescriptor");
            }
        }
    }
}
