/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.reviewing.persistence.evaluation.EvaluationInstance;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;

/**
 * A review is linked to two PeerReviewInstnace : the one who review and the
 * original reviewed 'author'
 *
 * A review is composed of the feedback (written by reviewers) and the feedback
 * evaluation (written by author). Both are a list of evaluation instances
 * 
 * 
 * 
 * <ol>
 * <li> dispatched: initial state, reviewer can edit feedback
 * <li> reviewed: reviewer can't edit feedback anymore, author can't read feedback yet
 * <li> notified: author has access to the feedback and can edit feedbackEvaluation
 * <li> closed: feedback evaluation turns read-only, not yet visible by peers <li>
 * <li> closed: feedback evaluation is visible by the reviewer <li>
 * </ol>
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class Review extends AbstractEntity {

    public enum ReviewState {
        DISPATCHED,
        REVIEWED,
        NOTIFIED,
        COMPLETED,
        CLOSED
    };

    @Id
    @GeneratedValue
    private Long id;

    private ReviewState status;

    /**
     * the PeerReviewInstance that belongs to the reviewer
     */
    @ManyToOne
    @JsonIgnore
    private PeerReviewInstance reviewer;

    /**
     * the PeerReviewInstance that belongs to the reviewed author
     */
    @ManyToOne
    @JsonIgnore
    private PeerReviewInstance author;

    /**
     * List of evaluation instances that compose the feedback (writable by 'reviewer' only)
     */
    @OneToMany(mappedBy = "feedbackReview", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvaluationInstance> feedback = new ArrayList<>();

    /**
     * List of evaluation instances that compose the feedback evaluation (writable by 'author' only)
     */
    @OneToMany(mappedBy = "feedbackEvaluationReview", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvaluationInstance> feedbackEvaluation = new ArrayList<>();


    public Review(){
        super();
    }

    @Override
    public Long getId() {
        return id;
    }

    /**
     * get Review status
     * @return 
     */
    public ReviewState getStatus() {
        return status;
    }

    /**
     * Set review status
     * @param status 
     */
    public final void setStatus(ReviewState status) {
        this.status = status;
    }

    /**
     * get the PeerReviewInstance that belongs to the reviewer
     * @return the PeerReviewInstnace that belongs to the reviewer
     */
    public PeerReviewInstance getReviewer() {
        return reviewer;
    }

    /**
     * set the PeerReviewInstance that belongs to the reviewer
     * @param reviewer the PeerReviewInstnace that belongs to the reviewer
     */
    public final void setReviewer(PeerReviewInstance reviewer) {
        this.reviewer = reviewer;
    }
    
    
    /**
     * get the PeerReviewInstance that belongs to the author
     * @return the PeerReviewInstnace that belongs to the author
     */
    public PeerReviewInstance getAuthor() {
        return author;
    }

    /**
     * set the PeerReviewInstance that belongs to the author
     * @param author the PeerReviewInstnace that belongs to the author
     */
    public final void setAuthor(PeerReviewInstance author) {
        this.author = author;
    }

    /**
     * get the list of evaluation instance composing the feedback
     * @return the list of evaluation instance composing the feedback
     */
    public final List<EvaluationInstance> getFeedback() {
        return feedback;
    }

    /**
     * set the list of evaluation instance composing the feedback
     * @param feedback the list of evaluation instance composing the feedback
     */
    public void setFeedback(List<EvaluationInstance> feedback) {
        this.feedback = feedback;
    }

    /**
     * set the list of evaluation instance composing the feedback evaluation
     * @return the list of evaluation instance composing the feedback evaluation
     */
    public final List<EvaluationInstance> getFeedbackEvaluation() {
        return feedbackEvaluation;
    }

    /**
     * set the list of evaluation instance composing the feedback evaluation
     * @param feedbackEvaluation  the list of evaluation instance composing the feedback evaluation
     */
    public void setFeedbackEvaluation(List<EvaluationInstance> feedbackEvaluation) {
        this.feedbackEvaluation = feedbackEvaluation;
    }

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof Review) {
            Review o = (Review) other;
            //this.setAuthor(o.getAuthor());
            //this.setReviewer(o.getReviewer());
            this.setFeedback(ListUtils.mergeLists(this.getFeedback(), o.getFeedback()));
            this.setFeedbackEvaluation(ListUtils.mergeLists(this.getFeedbackEvaluation(), o.getFeedbackEvaluation()));
        }
    }

}
