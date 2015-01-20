/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence;

import com.wegas.reviewing.persistence.evaluation.EvaluationInstance;
import com.wegas.core.persistence.AbstractEntity;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;

/**
 * A review is linked to two PeerReviewingInstnace : the one who review and the
 * original reviewed 'author'
 *
 * A review is composed of the feedback (written by reviewers) and the feedback
 * evaluation (written by author). Both are a list of evaluation instances
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class Review extends AbstractEntity {

    @Id
    @GeneratedValue
    private Long id;

    /**
     * the PeerReviewingInstance that belongs to the reviewer
     */
    @ManyToOne
    private PeerReviewingInstance reviewer;

    /**
     * the PeerReviewingInstance that belongs to the reviewed author
     */
    @ManyToOne
    private PeerReviewingInstance author;

    /**
     * List of evaluation instances that compose the feedback (writable by 'reviewer' only)
     */
    @OneToMany(mappedBy = "feedback")
    private List<EvaluationInstance> feedback = new ArrayList<>();

    /**
     * List of evaluation instances that compose the feedback evaluation (writable by 'author' only)
     */
    @OneToMany(mappedBy = "feedbackEvaluation")
    private List<EvaluationInstance> feedbacksEvaluation = new ArrayList<>();

    @Override
    public Long getId() {
        return id;
    }

    /**
     * get the PeerReviewInstance that belongs to the reviewer
     * @return the PeerReviewInstnace that belongs to the reviewer
     */
    public PeerReviewingInstance getReviewer() {
        return reviewer;
    }

    /**
     * set the PeerReviewInstance that belongs to the reviewer
     * @param reviewer the PeerReviewInstnace that belongs to the reviewer
     */
    public void setReviewer(PeerReviewingInstance reviewer) {
        this.reviewer = reviewer;
    }
    
    
    /**
     * get the PeerReviewInstance that belongs to the author
     * @return the PeerReviewInstnace that belongs to the author
     */
    public PeerReviewingInstance getAuthor() {
        return author;
    }

    /**
     * set the PeerReviewInstance that belongs to the author
     * @param author the PeerReviewInstnace that belongs to the author
     */
    public void setAuthor(PeerReviewingInstance author) {
        this.author = author;
    }

    /**
     * get the list of evaluation instance composing the feedback
     * @return the list of evaluation instance composing the feedback
     */
    public List<EvaluationInstance> getFeedback() {
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
    public List<EvaluationInstance> getFeedbacksEvaluation() {
        return feedbacksEvaluation;
    }

    /**
     * set the list of evaluation instance composing the feedback evaluation
     * @param feedbacksEvaluation  the list of evaluation instance composing the feedback evaluation
     */
    public void setFeedbacksEvaluation(List<EvaluationInstance> feedbacksEvaluation) {
        this.feedbacksEvaluation = feedbacksEvaluation;
    }

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof Review) {
            Review o = (Review) other;
        }
    }

}
