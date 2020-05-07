/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.ejb;

import com.wegas.core.Helper;
import com.wegas.core.api.ReviewingFacadeI;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.ejb.WegasAbstractFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.EnumItem;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.scope.AbstractScope;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.security.util.WegasEntityPermission;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import com.wegas.reviewing.persistence.PeerReviewInstance;
import com.wegas.reviewing.persistence.Review;
import com.wegas.reviewing.persistence.evaluation.CategorizedEvaluationDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptorContainer;
import com.wegas.reviewing.persistence.evaluation.EvaluationInstance;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * PeerReview Inject Facade
 * <p>
 * Contains PeerReviewing logic
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Stateless
@LocalBean
public class ReviewingFacade extends WegasAbstractFacade implements ReviewingFacadeI {

    static final private Logger logger = LoggerFactory.getLogger(ReviewingFacade.class);
    private static final long serialVersionUID = 5140216834760973410L;

    /**
     * Default Constructor
     */
    public ReviewingFacade() {
        // useless but ensure there is an empty constructor
    }
    /**
     * Player Facade
     */
    @Inject
    private PlayerFacade playerFacade;
    /**
     * Variable Instance Facade
     */
    @Inject
    private VariableInstanceFacade variableInstanceFacade;
    /**
     * Variable Descriptor Facade
     */
    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     * Get a Review by id
     *
     * @param entityId the reviewID
     *
     * @return the corresponding review or null
     */
    public Review findReview(final Long entityId) {
        return this.getEntityManager().find(Review.class, entityId);
    }

    /**
     * Get an evaluationInstance by Id
     *
     * @param evId evaluation instance id
     *
     * @return the evaluation instance or null
     */
    public EvaluationInstance findEvaluationInstance(Long evId) {
        return this.getEntityManager().find(EvaluationInstance.class, evId);
    }

    /**
     * Get an evaluationDescriptor by Id
     *
     * @param evId evaluation descriptor id
     *
     * @return the evaluation descriptor or null
     */
    public EvaluationDescriptor findEvaluationDescriptor(Long evId) {
        return this.getEntityManager().find(EvaluationDescriptor.class, evId);
    }

    public Collection<WegasPermission> getReviewReadPermission(Review aReview) {
        Query query = getEntityManager().createNamedQuery("Review.findOwners");
        query.setParameter(1, aReview.getId());
        List results = query.getResultList();

        Collection<WegasPermission> perms = new ArrayList<>();
        for (Object item : results) {
            Object[] tuple = (Object[]) item;
            String entityType = (String) tuple[0];
            Long entityId = (Long) tuple[1];

            perms.add(new WegasEntityPermission(entityId, WegasEntityPermission.Level.READ, WegasEntityPermission.EntityType.valueOf(entityType)));
        }

        return perms;
    }

    /**
     *
     * @param prd
     *
     * @return
     */
    private List<PeerReviewInstance> getInstances(PeerReviewDescriptor prd) {
        return new ArrayList(variableDescriptorFacade.getInstances(prd).values());
    }

    /**
     * Let a player submit his variable. It means the variable become ready to be reviewed
     *
     * @param prd the PeerReview Descriptor
     * @param p   the player submitting
     */
    @Override
    public void submit(PeerReviewDescriptor prd, Player p) {
        PeerReviewInstance instance = prd.getInstance(p);
        if (instance.getReviewState() == PeerReviewDescriptor.ReviewingState.NOT_STARTED || instance.getReviewState() == PeerReviewDescriptor.ReviewingState.SUBMITTED) {
            instance.setReviewState(PeerReviewDescriptor.ReviewingState.SUBMITTED);
        } else {
            throw WegasErrorMessage.error("Error: already submitted");
        }
    }

    /**
     * Let a player submit his variable. It means the variable become ready to be reviewed
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
     *
     * @return a brand new review, ready to be edited by the reviewer
     */
    private Review createReview(PeerReviewDescriptor prd, PeerReviewInstance author, PeerReviewInstance reviewer) {
        Review r = new Review();
        r.setReviewState(Review.ReviewState.DISPATCHED);

        reviewer.addToToReview(r);
        author.addToReviewed(r);

        //r.setAuthor(author);
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
        this.getEntityManager().persist(r);
        return r;
    }

    /**
     * Called by the teacher, it will take each PeerReviewInstance matching the given peer review
     * descriptor and dispatch them (who review who?)
     *
     * @param prd peer review descriptor to dispatch
     *
     * @return all peerreviewinstance which have been modified
     */
    public List<PeerReviewInstance> dispatch(PeerReviewDescriptor prd) {
        AbstractScope scope = prd.getScope();
        //Collection<VariableInstance> values = scope.getVariableInstances().values(); // TODO
        List<PeerReviewInstance> pris = new ArrayList<>();
        List<PeerReviewInstance> touched = new ArrayList<>();
        List<PeerReviewInstance> evicted = new ArrayList<>();

        if (scope instanceof GameModelScope) {
            throw WegasErrorMessage.error("Invalid Scope for PeerReview descriptor. GameModelScope does not make any sense for this kind of data");
        }

        int numberOfReview;

        if (!prd.getGameModel().isPlay()) {
            // Not a real game
            // Edit Scenario Case -> there is only one game (debug) and one player (TestPlayer)
            // In this case, allow the player to review itself once
            numberOfReview = 2;
            Player testPlayer = prd.getGameModel().getGames().get(0).getTeams().get(0).getPlayers().get(0);
            pris.add(prd.getInstance(testPlayer));
        } else {
            /*
             * Real Game: evict test or "ghost" instance(s)
             *
             * In case peerreview variable is game/gameModel scoped, there will be only one
             * instance for the whole game and such an instance will be evicted.... For the
             * time, it sounds like OK since such a review seems useless
             */
            for (Game game : prd.getGameModel().getGames()) {
                for (Team team : game.getTeams()) {
                    if (scope instanceof TeamScope) {
                        // 1 instance per team: evict empty team instances
                        TeamScope tScope = (TeamScope) scope;
                        PeerReviewInstance instance = (PeerReviewInstance) variableInstanceFacade.getTeamInstance(tScope, team);
                        if (team.getPlayers().isEmpty() || team instanceof DebugTeam) {
                            // Discared instance
                            instance.setReviewState(PeerReviewDescriptor.ReviewingState.DISCARDED);
                            variableInstanceFacade.merge(instance);
                            touched.add(instance);
                        } else {
                            pris.add(instance);
                        }
                    } else { // PlayerScoped
                        // 1 instance per player: evict test player instance
                        for (Player p : team.getPlayers()) {
                            PeerReviewInstance instance = (PeerReviewInstance) variableInstanceFacade.getPlayerInstance((PlayerScope) scope, p);
                            if (team instanceof DebugTeam) {
                                // Discared instance
                                instance.setReviewState(PeerReviewDescriptor.ReviewingState.DISCARDED);
                                variableInstanceFacade.merge(instance);
                                touched.add(instance);
                            } else {
                                pris.add(instance);
                            }
                        }
                    }
                }
            }

            VariableDescriptor toReview = prd.getToReview();
            for (Iterator<PeerReviewInstance> it = pris.iterator(); it.hasNext();) {
                PeerReviewInstance pri = it.next();
                VariableInstance toReviewInstance = toReview.findInstance(pri, null);
                if (toReviewInstance != null) {

                    boolean reject = false;

                    if (pri.getReviewState() == PeerReviewDescriptor.ReviewingState.COMPLETED
                        || pri.getReviewState() == PeerReviewDescriptor.ReviewingState.DISPATCHED
                        || pri.getReviewState() == PeerReviewDescriptor.ReviewingState.NOTIFIED) {
                        // Only accept NOT_STARTED and SUBMITTING states
                        reject = true;
                    } else if (toReviewInstance instanceof TextInstance) {
                        TextInstance primitive = (TextInstance) toReviewInstance;
                        String primitiveValue = primitive.getValue(),
                            defaultValue = ((TextInstance) primitive.getDescriptor().getDefaultInstance()).getValue();
                        reject = Helper.isNullOrEmpty(primitiveValue) || primitiveValue.equals(defaultValue);
                    } else if (toReviewInstance instanceof StringInstance) {
                        StringInstance primitive = (StringInstance) toReviewInstance;
                        String primitiveValue = primitive.getValue(),
                            defaultValue = ((StringInstance) primitive.getDescriptor().getDefaultInstance()).getValue();
                        reject = Helper.isNullOrEmpty(primitiveValue) || primitiveValue.equals(defaultValue);
                    }

                    if (reject) {
                        pri.setReviewState(PeerReviewDescriptor.ReviewingState.EVICTED);
                        variableInstanceFacade.merge(pri);
                        touched.add(pri);
                        evicted.add(pri);
                        it.remove();
                    }
                }
            }
            numberOfReview = Math.min(prd.getMaxNumberOfReview(), pris.size() - 1);
            if (numberOfReview < 1) {
                throw WegasErrorMessage.error("Unable to dispatch reviews: there is not enough players");
            }
        }

        Collections.shuffle(pris);

        int i, j;
        for (i = 0; i < pris.size(); i++) {
            PeerReviewInstance author = pris.get(i);

            if (author.getReviewState() == PeerReviewDescriptor.ReviewingState.SUBMITTED
                || author.getReviewState() == PeerReviewDescriptor.ReviewingState.NOT_STARTED) {
                logger.warn("Dispatch Author");
                //List<Review> reviewed = author.getReviewed();
                for (j = 1; j <= numberOfReview; j++) {
                    PeerReviewInstance reviewer = pris.get((i + j) % pris.size());

                    createReview(prd, author, reviewer);
                    //reviewed.add(r);
                    //reviewer.getToReview().add(r);
                    variableInstanceFacade.merge(reviewer);
                }
                author.setReviewState(PeerReviewDescriptor.ReviewingState.DISPATCHED);
                variableInstanceFacade.merge(author);
                touched.add(author);
            }
        }

        if (prd.getIncludeEvicted()) {
            // Give some work even to users who didn't do their job
            for (PeerReviewInstance reviewer : evicted) {
                for (j = 0; j < numberOfReview; j++) {
                    // NOTE : such an author will have some extra feedback !
                    PeerReviewInstance author = pris.get(j % pris.size());
                    createReview(prd, author, reviewer);
                }
            }
        }

        /*for (PeerReviewInstance pri : pris) {
            variableInstanceFacade.merge(pri);
            em.flush();
        }*/
        return touched;
    }

    /**
     * Called by the teacher, it will take each PeerReviewInstance matching the given peer review
     * descriptor and dispatch them (who review who?)
     *
     * @param peerReviewDescriptorId peer review descriptor id to dispatch
     */
    public List<PeerReviewInstance> dispatch(Long peerReviewDescriptorId) {
        VariableDescriptor vd = variableDescriptorFacade.find(peerReviewDescriptorId);
        if (vd instanceof PeerReviewDescriptor) {
            return dispatch((PeerReviewDescriptor) vd);
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
     * Retrieve the PeerReviewInstance containing given Review that belongs to the currentPlayer
     *
     * @param review
     *
     * @return peer review instance that belong to the current player
     */
    public PeerReviewInstance getPeerReviewInstanceFromReview(Review review, Player player) {
        PeerReviewInstance author = review.getAuthor();

        //PeerReviewDescriptor desc = (PeerReviewDescriptor) descriptorFacade.find(author.getDescriptor().getId());
        PeerReviewInstance instance = (PeerReviewInstance) author.getDescriptor().getInstance(player);
        return instance;
    }

    /**
     * Save a review posted by a player
     *
     * @param pri   peer review instance containing the review
     * @param other the review to merge within pri
     *
     * @return up to date review
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

        this.getEntityManager().merge(review);
        return review;
    }

    /**
     * Submitting a review occurs twice in the whole process First time when the reviewer post his
     * review. In this case, the review switch from DISPATCHED to REVIEWED. The second time is when
     * the author post his comments, switch from NOTIFIED to COMPLETED
     *
     * @param review the review to submit
     * @param player
     *
     * @return review
     */
    public Review submitReview(Review review, Player player) {
        Review r = this.findReview(review.getId());
        PeerReviewInstance pri = this.getPeerReviewInstanceFromReview(r, player);
        r = this.saveReview(pri, review);
        if (r.getReviewState() == Review.ReviewState.DISPATCHED) {
            r.setReviewState(Review.ReviewState.REVIEWED);
            //em.merge(r);
        } else if (r.getReviewState() == Review.ReviewState.NOTIFIED) {
            r.setReviewState(Review.ReviewState.COMPLETED);
            //em.merge(r);
        }
        return r;
    }

    /**
     * {@link #submitReview(com.wegas.reviewing.persistence.Review) } a review by id
     *
     * @param reviewId
     *
     * @return the submitted review
     */
    public Review submitReview(Long reviewId, Player player) {
        return this.submitReview(this.getEntityManager().find(Review.class, reviewId), player);
    }

    /**
     * Reviewing phase is over -> authors will be able to see feedbacks
     *
     * @param prd the PeerReviewDescriptor
     *
     * @return
     */
    public List<PeerReviewInstance> notify(PeerReviewDescriptor prd) {
        List<PeerReviewInstance> pris = this.getInstances(prd);
        List<PeerReviewInstance> touched = new ArrayList<>();
        for (PeerReviewInstance pri : pris) {
            if (pri.getReviewState() != PeerReviewDescriptor.ReviewingState.DISCARDED && pri.getReviewState() != PeerReviewDescriptor.ReviewingState.EVICTED) {

                if (pri.getReviewState() == PeerReviewDescriptor.ReviewingState.DISPATCHED) {
                    for (Review review : pri.getReviewed()) {
                        if (review.getReviewState() == Review.ReviewState.DISPATCHED || review.getReviewState() == Review.ReviewState.REVIEWED) {
                            review.setReviewState(Review.ReviewState.NOTIFIED);
                        }
                    }
                    pri.setReviewState(PeerReviewDescriptor.ReviewingState.NOTIFIED);
                } else {
                    pri.setReviewState(PeerReviewDescriptor.ReviewingState.EVICTED);
                }
                touched.add(pri);
                variableInstanceFacade.merge(pri);
                //requestManager.addUpdatedInstance(pri);
            }
        }
        return touched;
    }

    /**
     * Reviewing phase is over -> authors will be able to see feedbacks
     *
     * @param peerReviewDescriptorId
     */
    public List<PeerReviewInstance> notify(Long peerReviewDescriptorId) {
        VariableDescriptor vd = variableDescriptorFacade.find(peerReviewDescriptorId);
        if (vd instanceof PeerReviewDescriptor) {
            return notify((PeerReviewDescriptor) vd);
        } else {
            throw WegasErrorMessage.error("Notify failed: Descriptor is not instance of PeerReviewDescriptor");
        }
    }

    /**
     * The Reviewing will be completely finished after closing
     *
     * @param prd
     *
     * @return all peerReviewInstance that have been closed
     */
    public List<PeerReviewInstance> close(PeerReviewDescriptor prd) {
        List<PeerReviewInstance> pris = this.getInstances(prd);
        List<PeerReviewInstance> touched = new ArrayList<>();
        for (PeerReviewInstance pri : pris) {
            if (pri.getReviewState() != PeerReviewDescriptor.ReviewingState.DISCARDED && pri.getReviewState() != PeerReviewDescriptor.ReviewingState.EVICTED) {
                if (pri.getReviewState() == PeerReviewDescriptor.ReviewingState.NOTIFIED) {
                    for (Review review : pri.getReviewed()) {
                        if (review.getReviewState() == Review.ReviewState.NOTIFIED
                            || review.getReviewState() == Review.ReviewState.COMPLETED) {
                            review.setReviewState(Review.ReviewState.CLOSED);
                        }
                    }
                    pri.setReviewState(PeerReviewDescriptor.ReviewingState.COMPLETED);
                } else {
                    pri.setReviewState(PeerReviewDescriptor.ReviewingState.EVICTED);
                }
                touched.add(pri);
                variableInstanceFacade.merge(pri);
            }
            //requestManager.addUpdatedInstance(pri);
        }
        return touched;
    }

    /**
     * Reviewing phase is over. Author will be able to see feedbacks
     *
     * @param peerReviewDescriptorId
     *
     * @return all PeerReviewInstance which have been closed
     */
    public List<PeerReviewInstance> close(Long peerReviewDescriptorId) {
        VariableDescriptor vd = variableDescriptorFacade.find(peerReviewDescriptorId);
        if (vd instanceof PeerReviewDescriptor) {
            return close((PeerReviewDescriptor) vd);
        } else {
            throw WegasErrorMessage.error("Close failed: Descriptor is not instance of PeerReviewDescriptor");
        }
    }

    /**
     * Since PeerReviewDescriptor toReview variable is only referenced by its own private name on
     * the JSON side, we have to resolve those name to effective VariableDescriptor
     * <p>
     * Moreover, as the variable may not yet exists (especially when posting a whole GameModel) when
     * the PeerReviewDescriptor is created, we'll have to wait to resolve such identifier.
     * <p>
     * This is done by listening to EntityRevivedEvent
     *
     * @param reviewD
     */
    public void revivePeerReviewDescriptor(PeerReviewDescriptor reviewD) {
        try {
            String toReviewName = reviewD.getImportedToReviewName();
            if (toReviewName != null) {
                GameModel gameModel = reviewD.getGameModel();
                VariableDescriptor toReview = variableDescriptorFacade.find(gameModel, toReviewName);
                reviewD.setToReview(toReview);
            }

            assertScopesAreValid(reviewD);

            this.reviveEvaluations(reviewD.getFeedback(), reviewD);
            this.reviveEvaluations(reviewD.getFbComments(), reviewD);
        } catch (WegasNoResultException ex) {
            logger.error("Failed te revive ReviewDescriptor", ex);
            reviewD.setToReview(null);
        }
    }

    private void reviveEvaluations(EvaluationDescriptorContainer container, PeerReviewDescriptor parent) {
        for (EvaluationDescriptor ed : container.getEvaluations()) {
            if (ed.getLabel() != null) {
                ed.getLabel().setParentDescriptor(parent);
            }
            if (ed.getDescription() != null) {
                ed.getDescription().setParentDescriptor(parent);
                if (ed instanceof CategorizedEvaluationDescriptor) {
                    CategorizedEvaluationDescriptor ced = (CategorizedEvaluationDescriptor) ed;
                    for (EnumItem category : ced.getCategories()) {
                        if (category.getLabel() != null) {
                            category.getLabel().setParentDescriptor(parent);
                        }
                    }
                }
            }
        }
    }

    public void revivePeerReviewInstance(PeerReviewInstance reviewI) {
        this.assertScopesAreValid((PeerReviewDescriptor) reviewI.findDescriptor());
    }

    private void assertScopesAreValid(PeerReviewDescriptor prd) {

        VariableDescriptor toReview = prd.getToReview();

        AbstractScope rScope = prd.getScope();
        AbstractScope vScope = toReview.getScope();
        if (rScope instanceof GameModelScope) {
            throw WegasErrorMessage.error("GameModel/Game Scope is forbidden for " + prd);
        }
        if (rScope instanceof TeamScope && vScope instanceof PlayerScope) {
            throw WegasErrorMessage.error("Reviewed variable " + toReview + " scope is too scpecific");
        }
    }
}
