/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.Helper;
import com.wegas.reviewing.persistence.evaluation.EvaluationInstance;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Broadcastable;
import com.wegas.core.persistence.ListUtils;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OrderBy;
import javax.persistence.Table;

/**
 * A review is linked to two PeerReviewInstnace : the one who reviews and the
 * original reviewed 'author'
 *
 * A review is composed of the feedback (written by reviewers) and the feedback
 * comments (written by author). Both are a list of evaluation instances
 *
 *
 * <ol>
 * <li> dispatched: initial state, reviewer can edit feedback
 * <li> reviewed: reviewer can't edit feedback anymore, author can't read
 * feedback yet
 * <li> notified: author has access to the feedback and can edit feedback
 * comments
 * <li> completed: feedback comments turns read-only, not yet visible by peers
 * <li>
 * <li> closed: feedback comments is visible by the reviewer <li>
 * </ol>
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
@Table(indexes = {
    @Index(columnList = "author_variableinstance_id"),
    @Index(columnList = "reviewer_variableinstance_id")
})
public class Review extends AbstractEntity implements Broadcastable {

    private static final long serialVersionUID = 1L;

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

    private ReviewState reviewState;

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
     * List of evaluation instances that compose the feedback (writable by
     * 'reviewer' only)
     */
    @OneToMany(mappedBy = "feedbackReview", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<EvaluationInstance> feedback = new ArrayList<>();

    /**
     * List of evaluation instances that compose the feedback evaluation
     * (writable by 'author' only)
     */
    @OneToMany(mappedBy = "commentsReview", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("id ASC")
    private List<EvaluationInstance> comments = new ArrayList<>();

    @Override
    public Long getId() {
        return id;
    }

    /**
     * get Review status
     *
     * @return
     */
    public ReviewState getReviewState() {
        return reviewState;
    }

    /**
     * Set review state
     *
     * @param state
     */
    public void setReviewState(ReviewState state) {
        this.reviewState = state;
    }

    /**
     * get the PeerReviewInstance that belongs to the reviewer
     *
     * @return the PeerReviewInstnace that belongs to the reviewer
     */
    public PeerReviewInstance getReviewer() {
        return reviewer;
    }

    /**
     * set the PeerReviewInstance that belongs to the reviewer
     *
     * @param reviewer the PeerReviewInstnace that belongs to the reviewer
     */
    public void setReviewer(PeerReviewInstance reviewer) {
        this.reviewer = reviewer;
    }

    /**
     * get the PeerReviewInstance that belongs to the author
     *
     * @return the PeerReviewInstnace that belongs to the author
     */
    public PeerReviewInstance getAuthor() {
        return author;
    }

    /**
     * set the PeerReviewInstance that belongs to the author
     *
     * @param author the PeerReviewInstnace that belongs to the author
     */
    public void setAuthor(PeerReviewInstance author) {
        this.author = author;
    }

    /**
     * get the list of evaluation instance composing the feedback
     *
     * @return the list of evaluation instance composing the feedback
     */
    public List<EvaluationInstance> getFeedback() {
        return feedback;
    }

    /**
     * set the list of evaluation instance composing the feedback
     *
     * @param feedback the list of evaluation instance composing the feedback
     */
    public void setFeedback(List<EvaluationInstance> feedback) {
        this.feedback = feedback;
    }

    /**
     * get the list of evaluation instances composing the feedback comments
     *
     * @return the list of evaluation instances composing the feedback comments
     */
    public List<EvaluationInstance> getComments() {
        return comments;
    }

    /**
     * set the list of evaluation instance composing the feedback comments
     *
     * @param comments the list of evaluation instance composing the feedback
     *                 comments
     */
    public void setComments(List<EvaluationInstance> comments) {
        this.comments = comments;
    }

    @Override
    public Map<String, List<AbstractEntity>> getEntities() {
        Map<String, List<AbstractEntity>> entities = new HashMap<>();
        Helper.merge(entities, this.getAuthor().getEntities());
        Helper.merge(entities, this.getReviewer().getEntities());
        return entities;
    }

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof Review) {
            Review o = (Review) other;
            //this.setAuthor(o.getAuthor());
            //this.setReviewer(o.getReviewer());
            this.setFeedback(ListUtils.mergeLists(this.getFeedback(), o.getFeedback()));
            this.setComments(ListUtils.mergeLists(this.getComments(), o.getComments()));
        }
    }

}
