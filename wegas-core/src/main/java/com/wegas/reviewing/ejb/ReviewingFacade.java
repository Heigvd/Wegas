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
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.ScriptEventFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.event.internal.DescriptorRevivedEvent;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.reviewing.persistence.PeerReviewInstance;
import com.wegas.reviewing.persistence.Review;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationInstance;
import java.util.ArrayList;
import java.util.Collection;
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

    @Inject
    private RequestManager requestManager;

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
        Collection<VariableInstance> values = prd.getScope().getVariableInstances().values();
        List<PeerReviewInstance> pris = new ArrayList(values);
        int numberOfReview;

        if (prd.getGameModel().getTemplate()) {
            // Edit Scenario Case -> there is only one game (debug) and one player (TestPlayer)
            // In this case, allow the player to review itself once
            numberOfReview = 1;
        } else {
            /*
             * Real Game: evict test instance(s)
             *
             * In case peerreview variable is game/gameModel scoped, there will be only one 
             * instance for the whole game and such an instance will be evicted.... For the 
             * time, it sounds like OK since such a review seems useless
             */
            for (Game game : prd.getGameModel().getGames()) {
                for (Team team : game.getTeams()) {
                    if (team instanceof DebugTeam) {
                        for (Player p : team.getPlayers()) {
                            PeerReviewInstance instance = prd.getInstance(p);
                            // Discared instance
                            instance.setReviewState(PeerReviewDescriptor.ReviewingState.DISCARDED);
                            pris.remove(instance);
                            variableInstanceFacade.merge(instance);
                        }
                    }
                }
            }
            numberOfReview = Math.min(prd.getMaxNumberOfReview(), pris.size() - 1);
            //throw WegasErrorMessage.error("Unable to dispatch reviews: there is not enough players");
        }

        // Todo: evict dispatched instances
        Collections.shuffle(pris);

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
                    //reviewer.getToReview().add(r);
                }
                author.setReviewState(PeerReviewDescriptor.ReviewingState.DISPATCHED);
            }
        }
        for (PeerReviewInstance pri : pris) {
            variableInstanceFacade.merge(pri);
            em.flush();
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
    }

    public void mergeEvaluations(List<EvaluationInstance> evs) {
        for (EvaluationInstance other : evs) {
            EvaluationInstance ev = this.findEvaluationInstance(other.getId());
            ev.merge(other);
        }
    }

    public PeerReviewInstance getPeerReviewInstanceFromReview(Review review) {
        PeerReviewInstance author = review.getAuthor();
        Player currentPlayer = requestManager.getPlayer();
        if (currentPlayer == null) {
            currentPlayer = author.getDescriptor().getGameModel().getGames().get(0).getPlayers().get(0);
        }

        //PeerReviewDescriptor desc = (PeerReviewDescriptor) descriptorFacade.find(author.getDescriptor().getId());
        PeerReviewInstance instance = (PeerReviewInstance) author.getDescriptor().getInstance(currentPlayer);
        return instance;
    }

    public Review saveReview(PeerReviewInstance pri, Review other) {
        Review review = this.findReview(other.getId());
        PeerReviewInstance author = review.getAuthor();
        PeerReviewInstance reviewer = review.getReviewer();

        if (pri == author && review.getStatus() == Review.ReviewState.NOTIFIED) {
            mergeEvaluations(other.getFeedbackEvaluation());
            requestManager.addUpdatedInstance(reviewer);
        }

        if (pri == reviewer && review.getStatus() == Review.ReviewState.DISPATCHED) {
            mergeEvaluations(other.getFeedback());
        }
        em.merge(review);
        return review;
    }

    public Review saveReview(Review other) {
        Review review = this.findReview(other.getId());
        PeerReviewInstance pri = this.getPeerReviewInstanceFromReview(review);
        return this.saveReview(pri, other);

    }

    public Review submitReview(Review other) {
        Review review = saveReview(other);
        if (review.getStatus() == Review.ReviewState.DISPATCHED) {
            review.setStatus(Review.ReviewState.REVIEWED);
            em.merge(review);
        } else if (review.getStatus() == Review.ReviewState.NOTIFIED){
            review.setStatus(Review.ReviewState.COMPLETED);
            em.merge(review);
        }
        return review;
    }

    public Review submitReview(Long reviewId) {
        return this.submitReview(em.find(Review.class, reviewId));
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
            requestManager.addUpdatedInstance(pri);
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

    public void close(PeerReviewDescriptor prd) {
        List<PeerReviewInstance> pris = new ArrayList(prd.getScope().getVariableInstances().values());
        for (PeerReviewInstance pri : pris) {
            for (Review review : pri.getReviewed()) {
                if (review.getStatus() == Review.ReviewState.NOTIFIED || 
                    review.getStatus() == Review.ReviewState.COMPLETED) {
                    review.setStatus(Review.ReviewState.CLOSED);
                }
            }
            variableInstanceFacade.merge(pri);
            requestManager.addUpdatedInstance(pri);
        }
    }

    /**
     * Reviewing phase is over -> author will be able to see feedbacks
     *
     * @param peerReviewDescriptorId
     */
    public void close(Long peerReviewDescriptorId) {
        VariableDescriptor vd = variableDescriptorFacade.find(peerReviewDescriptorId);
        if (vd instanceof PeerReviewDescriptor) {
            close((PeerReviewDescriptor) vd);
        } else {
            throw WegasErrorMessage.error("Close failed: Descriptor is not instance of PeerReviewDescriptor");
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
