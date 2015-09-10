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
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.event.internal.DescriptorRevivedEvent;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
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
 * PeerReview EJB Facade
 *
 * Contains PeerReviewing logic
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Stateless
@LocalBean
public class ReviewingFacade {

    static final private Logger logger = LoggerFactory.getLogger(ReviewingFacade.class);
    /**
     * The so called wegasPU persistenceContext
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     * Default Constructor
     */
    public ReviewingFacade() {
    }
    /**
     * Player Facade
     */
    @EJB
    private PlayerFacade playerFacade;
    /**
     * Variable Instance Facade
     */
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
    /**
     * Variable Descriptor Facade
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     * request-scoped Request Manager
     */
    @Inject
    private RequestManager requestManager;

    /**
     * Get a Review by id
     *
     * @param entityId the reviewID
     * @return the corresponding review or null
     */
    public Review findReview(final Long entityId) {
        return em.find(Review.class, entityId);
    }

    /**
     * Get an evaluationInstance by Id
     *
     * @param evId evaluation instance id
     * @return the evaluation instance or null
     */
    public EvaluationInstance findEvaluationInstance(Long evId) {
        return em.find(EvaluationInstance.class, evId);
    }

    /**
     * Let a player submit his variable. It means the variable become ready to
     * be reviewed
     *
     * @param prd the PeerReview Descriptor
     * @param p   the player submitting
     */
    public void submit(PeerReviewDescriptor prd, Player p) {
        PeerReviewInstance instance = prd.getInstance(p);
        if (instance.getReviewState() == PeerReviewDescriptor.ReviewingState.NOT_STARTED || instance.getReviewState() == PeerReviewDescriptor.ReviewingState.SUBMITTED) {
            instance.setReviewState(PeerReviewDescriptor.ReviewingState.SUBMITTED);
        } else {
            throw WegasErrorMessage.error("Error: already submitted");
        }
    }

    /**
     * Let a player submit his variable. It means the variable become ready to
     * be reviewed
     *
     * @param peerReviewDescriptorId the PeerReview Descriptor id
     * @param playerId               the player submitting
     */
    public void submit(Long peerReviewDescriptorId, Long playerId) {
        VariableDescriptor vd = variableDescriptorFacade.find(peerReviewDescriptorId);
        if (vd instanceof PeerReviewDescriptor) {
            submit((PeerReviewDescriptor) vd, playerFacade.find(playerId));
        } else {
            throw WegasErrorMessage.error("Submit failed: Descriptor is not instance of PeerReviewDescriptor");
        }
    }

    /**
     * Private method that initialise review instance when dispatching
     *
     * @param prd      the peer review descriptor
     * @param author   peer review instance corresponding to the author
     * @param reviewer peer review instance corresponding to the reviewer
     * @return a brand new review, ready to be edited by the reviewer
     */
    private Review createReview(PeerReviewDescriptor prd, PeerReviewInstance author, PeerReviewInstance reviewer) {
        Review r = new Review();
        r.setReviewState(Review.ReviewState.DISPATCHED);
        r.setAuthor(author);
        r.setReviewer(reviewer);
        for (EvaluationDescriptor ed : prd.getFeedback().getEvaluations()) {
            EvaluationInstance ei = ed.createInstance();
            ei.setFeedbackReview(r);
            r.getFeedback().add(ei);
        }
        for (EvaluationDescriptor ed : prd.getFbComments().getEvaluations()) {
            EvaluationInstance ei = ed.createInstance();
            ei.setCommentsReview(r);
            r.getComments().add(ei);
        }
        return r;
    }

    /**
     * Called by the teacher, it will take each PeerReviewInstance matching the
     * given peer review descriptor and dispatch them (who review who?)
     *
     * @param prd peer review descriptor to dispatch
     */
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

    /**
     * Called by the teacher, it will take each PeerReviewInstance matching the
     * given peer review descriptor and dispatch them (who review who?)
     *
     * @param peerReviewDescriptorId peer review descriptor id to dispatch
     */
    public void dispatch(Long peerReviewDescriptorId) {
        VariableDescriptor vd = variableDescriptorFacade.find(peerReviewDescriptorId);
        if (vd instanceof PeerReviewDescriptor) {
            dispatch((PeerReviewDescriptor) vd);
        } else {
            throw WegasErrorMessage.error("Submit failed: Descriptor is not instance of PeerReviewDescriptor");
        }
    }

    /**
     * @deprecated @param evalInstance
     * @param other
     */
    public void mergeEval(EvaluationInstance evalInstance, EvaluationInstance other) {
        evalInstance.merge(other);
    }

    /**
     * Save (update) evaluations in given list
     *
     * @param evs evaluations to update
     */
    public void mergeEvaluations(List<EvaluationInstance> evs) {
        for (EvaluationInstance other : evs) {
            EvaluationInstance ev = this.findEvaluationInstance(other.getId());
            ev.merge(other);
        }
    }

    /**
     * Retrieve the PeerReviewInstance containing given Review that belongs to
     * the currentPlayer
     *
     * @param review
     * @return peer review instance that belong to the current player
     */
    public PeerReviewInstance getPeerReviewInstanceFromReview(Review review) {
        PeerReviewInstance author = review.getAuthor();
        Player currentPlayer = requestManager.getPlayer();
        if (currentPlayer == null) {
            // No current player => debug team -> test player
            currentPlayer = author.getDescriptor().getGameModel().getGames().get(0).getPlayers().get(0);
        }

        //PeerReviewDescriptor desc = (PeerReviewDescriptor) descriptorFacade.find(author.getDescriptor().getId());
        PeerReviewInstance instance = (PeerReviewInstance) author.getDescriptor().getInstance(currentPlayer);
        return instance;
    }

    /**
     * Save a review posted by a player
     *
     * @param pri   peer review instance containing the review
     * @param other the review to merge within pri
     * @return
     */
    public Review saveReview(PeerReviewInstance pri, Review other) {
        Review review = this.findReview(other.getId());
        PeerReviewInstance author = review.getAuthor();
        PeerReviewInstance reviewer = review.getReviewer();

        /*
         * if author is posting and only if review state is notified:
         * update comments only
         */
        if (pri == author && review.getReviewState() == Review.ReviewState.NOTIFIED) {
            mergeEvaluations(other.getComments());
        }

        /*
         * if reviewer is posting and only if review state is dispatched:
         * update evaluation
         */
        if (pri == reviewer && review.getReviewState() == Review.ReviewState.DISPATCHED) {
            mergeEvaluations(other.getFeedback());
        }

        em.merge(review);
        return review;
    }

    /**
     * Submitting a review occurs twice in the whole process First time when the
     * reviewer post his review. In this case, the review switch from DISPATCHED
     * to REVIEWED. The second time is when the author post his comments, switch
     * from NOTIFIED to COMPLETED
     *
     * @param review the review to submit
     * @return review
     */
    public Review submitReview(Review review) {
        Review r = this.findReview(review.getId());
        PeerReviewInstance pri = this.getPeerReviewInstanceFromReview(r);
        r = this.saveReview(pri, review);
        if (r.getReviewState() == Review.ReviewState.DISPATCHED) {
            r.setReviewState(Review.ReviewState.REVIEWED);
            em.merge(r);
        } else if (r.getReviewState() == Review.ReviewState.NOTIFIED) {
            r.setReviewState(Review.ReviewState.COMPLETED);
            em.merge(r);
        }
        return r;
    }

    /**
     * {@link #submitReview(com.wegas.reviewing.persistence.Review) } a review
     * by id
     *
     * @param reviewId
     * @return the submitted review
     */
    public Review submitReview(Long reviewId) {
        return this.submitReview(em.find(Review.class, reviewId));
    }

    /**
     * Reviewing phase is over -> authors will be able to see feedbacks
     *
     * @param prd the PeerReviewDescriptor
     */
    public void notify(PeerReviewDescriptor prd) {
        List<PeerReviewInstance> pris = new ArrayList(prd.getScope().getVariableInstances().values());
        for (PeerReviewInstance pri : pris) {
            for (Review review : pri.getReviewed()) {
                if (review.getReviewState() == Review.ReviewState.DISPATCHED || review.getReviewState() == Review.ReviewState.REVIEWED) {
                    review.setReviewState(Review.ReviewState.NOTIFIED);
                }
            }
            variableInstanceFacade.merge(pri);
            //requestManager.addUpdatedInstance(pri);
        }
    }

    /**
     * Reviewing phase is over -> authors will be able to see feedbacks
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
     * The Reviewing will be completely finished after closing
     *
     * @param prd
     */
    public void close(PeerReviewDescriptor prd) {
        List<PeerReviewInstance> pris = new ArrayList(prd.getScope().getVariableInstances().values());
        for (PeerReviewInstance pri : pris) {
            for (Review review : pri.getReviewed()) {
                if (review.getReviewState() == Review.ReviewState.NOTIFIED
                        || review.getReviewState() == Review.ReviewState.COMPLETED) {
                    review.setReviewState(Review.ReviewState.CLOSED);
                }
            }
            variableInstanceFacade.merge(pri);
            //requestManager.addUpdatedInstance(pri);
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
                String toReviewName = reviewD.getImportedToReviewName();
                GameModel gameModel = reviewD.getGameModel();
                VariableDescriptor toReview = variableDescriptorFacade.find(gameModel, toReviewName);

                reviewD.setToReview(toReview);
            } catch (WegasNoResultException ex) {
                logger.error("Failed te revive ReviewDescriptor", ex);
                reviewD.setToReview(null);
            }
        }
    }
}
