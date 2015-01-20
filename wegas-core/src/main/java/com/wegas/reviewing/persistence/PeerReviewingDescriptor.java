/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence;

import com.wegas.reviewing.persistence.evaluation.EvaluationDescriptor;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableDescriptor;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.Transient;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * PeerReviewingDescriptor allows peer-reviewing of variable between (scope-dependent)
 Player/Team (ie the "author" and the "reviewers").
 *
 * A review: <ul>
 * <li> is made for a specific variable ('toReview' VariableDescriptor)</li>
 * <li> is define as, at least, one evaluation, defined as a 'feedback'</li>
 * <li> is done by several players/teams (reviewers) (up to
 * 'maxNumberOfReviewer'). Each author is reviewed the given number of times and
 * is a 'reviewer' for the same number of others authors</li>
 * </ul>
 *
 * Moreover, feedbacks can be evaluated by the author. Such an evaluation is
 * define by a EvaluationDescriptor list ('feedbacksEvaluations', can be empty)
 *
 * The reviewing process consists of X stage:
 * <ol>
 * <li> no-started: author edit its 'toReview' variable instance</li>
 * <li> dispatched: variable turns read-only, reviewers are chosen by such an
 * algorithm, feedback is editable by reviewers</li>
 * <li> reviewed: feedback turns read-only and become visible by the author,
 * feedback evaluation is possible</li>
 * <li> closed: feedback evaluation turns read-onlyA<li>
 * </ol>
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 * @see EvaluationDescriptor
 * @see PeerReviewingInstance
 */
@Entity
public class PeerReviewingDescriptor extends VariableDescriptor<PeerReviewingInstance> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(PeerReviewingDescriptor.class);

    public enum ReviewingState {
        NOT_STARTED, DISPATCHED, REVIEWED, CLOSED
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
    private String toReviewName;

    /**
     * Expected number of reviews. The number of reviews may be smaller,
     * especially is total number of team/player is too small
     *
     */
    private Integer maxNumberOfReviewer;

    /**
     * List of evaluations that compose one feedback. Here, en empty list does
     * not make any sense
     */
    @OneToMany(mappedBy = "feedbackReviewDescriptor")
    private List<EvaluationDescriptor> feedback = new ArrayList<>();

    /**
     * List of evaluations that compose the feedbacks evaluations. Empty list is
     * allowed
     */
    @OneToMany(mappedBy = "feedbackEvaluationReviewDescriptor")
    private List<EvaluationDescriptor> feedbackEvaluations = new ArrayList<>();

    /**
     *
     */
    public PeerReviewingDescriptor() {
        super();
    }

    /**
     *
     * @param name variable unique name
     */
    public PeerReviewingDescriptor(String name) {
        super(name);
    }

    /**
     *
     * @param name            variable unique name
     * @param defaultInstance
     */
    public PeerReviewingDescriptor(String name, PeerReviewingInstance defaultInstance) {
        super(name, defaultInstance);
    }

    /**
     *
     * @param a another PeerReviewingDescriptor
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof PeerReviewingDescriptor) {
            PeerReviewingDescriptor other = (PeerReviewingDescriptor) a;
            super.merge(a);
        }
    }

    /**
     * Return the variable that will be reviewed
     *
     * @return
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
        return (toReview != null ? toReview.getName() : null);
    }

    /**
     * Used to fetch the JSON de-serialised variable name
     *
     * @return
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
        return maxNumberOfReviewer;
    }

    /**
     * set the expected number of reviewers
     *
     * @param maxNumberOfReviewer the number of expected reviewers, shall be > 0
     *
     */
    public void setMaxNumberOfReview(Integer maxNumberOfReviewer) {
        if (maxNumberOfReviewer >= 0) {
            this.maxNumberOfReviewer = maxNumberOfReviewer;
        } else {
            this.maxNumberOfReviewer = 1; // TODO throw error ? 
        }
    }

    /**
     * get the feedback description
     *
     * @return a list of EvaluationDescriptor
     */
    public List<EvaluationDescriptor> getFeedback() {
        return feedback;
    }

    /**
     * set the feedback description
     *
     * @param feedback s list of EvaluationDescriptor
     */
    public void setFeedback(List<EvaluationDescriptor> feedback) {
        this.feedback = feedback;
    }

    /**
     * get the feedback evaluation description
     *
     * @return list of EvaluationDescriptor
     */
    public List<EvaluationDescriptor> getFeedbackEvaluations() {
        return feedbackEvaluations;
    }

    /**
     *
     * set the feedback evaluation description
     *
     * @param feedbackEvaluations list of evaluation descriptor
     */
    public void setFeedbacksEvaluations(List<EvaluationDescriptor> feedbackEvaluations) {
        this.feedbackEvaluations = feedbackEvaluations;
    }

}
