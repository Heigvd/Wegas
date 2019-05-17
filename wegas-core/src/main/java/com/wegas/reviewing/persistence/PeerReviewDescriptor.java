/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.persistence.annotations.WegasEntity;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.Helper;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.annotations.Scriptable;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.View.FlatVariableSelectView.TextOrNumberSelector;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.I18nHtmlView;
import com.wegas.editor.View.View;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptor;
import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptorContainer;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.Transient;
import javax.validation.constraints.NotNull;

/**
 *
 * PeerReviewDescriptor allows peer-reviewing of variable between
 * (scope-dependent) Player/Team (ie the "author" and the "reviewers").
 * <p>
 * A review: <ul>
 * <li> is made for a specific variable ('toReview' VariableDescriptor)</li>
 * <li> is define as, at least, one evaluation, defined as a 'feedback', wrapped
 * within a container</li>
 * <li> is done by several players/teams (reviewers) (up to
 * 'maxNumberOfReview'). Each author is reviewed the given number of times and
 * is a 'reviewer' for the same number of others authors</li>
 * </ul>
 * <p>
 * Moreover, feedbacks can be commented by the author. Such an evaluation is
 * define within an EvaluationDescriptorContainer('fbComments', nested list can
 * be empty)
 * <p>
 * The reviewing process consists of X stage:
 * <ol>
 * <li> not-started: author edit its 'toReview' variable instance</li>
 * <li> submitted: 'toReview' instances no longer editable </li>
 * <li> dispatched: variable turns read-only, reviewers are chosen by such an
 * algorithm</li>
 * </ol>
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 * @see EvaluationDescriptor
 * @see PeerReviewInstance
 */
@Entity
@Table(
        indexes = {
            @Index(columnList = "fbcomments_id"),
            @Index(columnList = "toreview_id"),
            @Index(columnList = "feedback_id"),
            @Index(columnList = "description_id")
        }
)
@WegasEntity(callback = PeerReviewDescriptor.PRDCallback.class)
public class PeerReviewDescriptor extends VariableDescriptor<PeerReviewInstance> {

    private static final long serialVersionUID = 1L;

    /**
     * Define review states
     */
    public enum ReviewingState {
        /**
         * completely out of reviewing process (debug team for instance)
         */
        DISCARDED,
        /**
         * partially out of reviewing process -> nothing to review
         */
        EVICTED,
        /**
         * author can edit toReview
         */
        NOT_STARTED,
        /**
         * authors can't edit toReview anymore
         */
        SUBMITTED,
        /**
         * toReview are dispatched, state became review dependent
         */
        DISPATCHED,
        /**
         * team take aquintance of peer evaluations
         */
        NOTIFIED,
        /**
         * Process completed
         */
        COMPLETED
    }

    /**
     * the variable to review
     */
    @ManyToOne
    @JsonIgnore
    private VariableDescriptor toReview;

    /**
     * the name of the variable to review. Only used for JSON de serialisation
     */
    @Transient
    @WegasEntityProperty(view = @View(label = "To Review", value = TextOrNumberSelector.class))
    private String toReviewName;

    /**
     * Allow evicted users to receive something to review
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(view = @View(label = "Also dispatch to peers who did not submit anything"))
    private Boolean includeEvicted;

    /**
     * Expected number of reviews. The number of reviews may be smaller,
     * especially is total number of team/player is too small
     * <p>
     */
    @WegasEntityProperty(view = @View(
            label = "Number of reviews",
            description = "Maximum reviews per user. Preferably greater than one."
    ))
    @Column(name = "maxNumberOfReviewer")
    private Integer maxNumberOfReview;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(view = @View(label = "Description", value = I18nHtmlView.class))
    private TranslatableContent description;

    /**
     * List of evaluations that compose one feedback. Here, en empty list does
     * not make any sense
     */
    @OneToOne(cascade = CascadeType.ALL)
    @JsonView(Views.EditorI.class)
    @NotNull
    @WegasEntityProperty(view = @View(label = "Feedback", value = Hidden.class))
    private EvaluationDescriptorContainer feedback;

    /**
     * List of evaluations that compose the feedbacks comments. Empty list is
     * allowed
     */
    @OneToOne(cascade = CascadeType.ALL)
    @JsonView(Views.EditorI.class)
    @NotNull
    @WegasEntityProperty(view = @View(label = "Comment on Feedback", value = Hidden.class))
    private EvaluationDescriptorContainer fbComments;

    /**
     * Return the variable that will be reviewed
     *
     * @return the variable that will be reviewed
     */
    public VariableDescriptor getToReview() {
        return toReview;
    }

    /**
     * Set the variable to review
     *
     * @param toReview
     */
    public void setToReview(VariableDescriptor toReview) {
        this.toReview = toReview;
    }

    /**
     * get the name of the variable to review
     *
     * @return variable to review unique name
     */
    public String getToReviewName() {
        return (toReview != null ? toReview.getName() : this.toReviewName);
    }

    /**
     * Used to fetch the JSON de-serialised variable name
     *
     * @return the name of the variable that will be reviewed, as imported from
     *         a JSON
     */
    @JsonIgnore
    public String getImportedToReviewName() {
        return toReviewName;
    }

    /**
     * set the name of the variable to review
     *
     * @param toReviewName the name to review
     */
    public void setToReviewName(String toReviewName) {
        this.toReviewName = toReviewName;
    }

    /**
     * get the expected number of reviewers
     *
     * @return expected number of reviewers
     */
    public Integer getMaxNumberOfReview() {
        return maxNumberOfReview;
    }

    /**
     * set the expected number of reviewers
     *
     * @param maxNumberOfReview the number of expected reviewers, shall be > 0
     *
     */
    public void setMaxNumberOfReview(Integer maxNumberOfReview) {
        if (maxNumberOfReview >= 0) {
            this.maxNumberOfReview = maxNumberOfReview;
        } else {
            this.maxNumberOfReview = 1; // TODO throw error ?
        }
    }

    /**
     * @return the description
     */
    public TranslatableContent getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(TranslatableContent description) {
        this.description = description;
        if (this.description != null) {
            this.description.setParentDescriptor(this);
        }
    }

    /**
     * get the feedback description
     *
     * @return a list of EvaluationDescriptor
     */
    public EvaluationDescriptorContainer getFeedback() {
        return feedback;
    }

    /**
     * set the feedback description
     *
     * @param feedback s list of EvaluationDescriptor
     */
    public void setFeedback(EvaluationDescriptorContainer feedback) {
        this.feedback = feedback;
        if (feedback != null) {
            feedback.setFeedbacked(this);
        }
    }

    /**
     * get the feedback evaluation description
     *
     * @return list of EvaluationDescriptor
     */
    public EvaluationDescriptorContainer getFbComments() {
        return fbComments;
    }

    /**
     *
     * set the feedback comments description
     *
     * @param fbComments list of evaluation descriptor
     */
    public void setFbComments(EvaluationDescriptorContainer fbComments) {
        this.fbComments = fbComments;
        if (fbComments != null) {
            fbComments.setFeedbacked(this);
        }
    }

    /*
     * SUGAR
     */
    /**
     * Get the review state of the given player's instance
     *
     * @param p the player
     *
     * @return player's instance state
     */
    @Scriptable
    public String getState(Player p) {
        return this.getInstance(p).getReviewState().toString();
    }

    @Scriptable
    public void setState(Player p, String stateName) {
        ReviewingState newState = ReviewingState.valueOf(stateName);
        PeerReviewInstance instance = this.getInstance(p);
        if (instance.getReviewState().equals(ReviewingState.SUBMITTED) && newState.equals(ReviewingState.NOT_STARTED)) {
            instance.setReviewState(ReviewingState.NOT_STARTED);
        }
    }

    public Boolean getIncludeEvicted() {
        return includeEvicted != null && includeEvicted;
    }

    public void setIncludeEvicted(Boolean includeEvicted) {
        this.includeEvicted = includeEvicted;
    }

    @Override
    public void revive(GameModel gameModel, Beanjection beans) {
        super.revive(gameModel, beans);
        beans.getReviewingFacade().revivePeerReviewDescriptor(this);
    }

    public static class PRDCallback implements WegasCallback {

        @Override
        public void postUpdate(Mergeable entity, Object ref, Object identifier) {
            if (entity instanceof PeerReviewDescriptor) {
                PeerReviewDescriptor prd = (PeerReviewDescriptor) entity;

                Helper.setNameAndLabelForLabelledEntityList(prd.getFeedback().getEvaluations(), "input", prd.getGameModel());
                Helper.setNameAndLabelForLabelledEntityList(prd.getFbComments().getEvaluations(), "input", prd.getGameModel());
            }
        }
    }
}
