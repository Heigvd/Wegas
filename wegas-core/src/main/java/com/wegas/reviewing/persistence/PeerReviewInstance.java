/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Instance of the PeerReviewDescriptor variable

 Author:<br />
 * - has to review several other authors: <code>toReview</code> Review list<br />
 * - is reviewed by several other authors: <code>reviewed</code> Review list

 The review is in a specific state, see PeerReviewDescriptor
 *
 *
 * @see PeerReviewDescriptor
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Entity
public class PeerReviewInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(PeerReviewInstance.class);

    private PeerReviewDescriptor.ReviewingState reviewState = PeerReviewDescriptor.ReviewingState.NOT_STARTED;

    @OneToMany(mappedBy = "reviewer")
    private List<Review> toReview = new ArrayList<>();

    @OneToMany(mappedBy = "author", cascade =CascadeType.ALL, orphanRemoval = true)
    private List<Review> reviewed = new ArrayList<>();

    public PeerReviewInstance() {
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof PeerReviewInstance) {
            PeerReviewInstance o = (PeerReviewInstance) a;
            this.setReviewState(o.getReviewState());
            this.setReviewed(ListUtils.mergeLists(this.getReviewed(), o.getReviewed()));
            this.setToReview(ListUtils.mergeLists(this.getToReview(), o.getToReview()));
        }
    }

    /**
     * Get the current state of the review
     *
     * @return the current state
     */
    public PeerReviewDescriptor.ReviewingState getReviewState() {
        return reviewState;
    }

    /**
     * Set the current state of the review
     *
     * @param state the new current state
     */
    public void setReviewState(PeerReviewDescriptor.ReviewingState state) {
        this.reviewState = state;
    }

    /**
     * Get the list of feedback to write to review others authors
     *
     * @return the list of feedback
     */
    public List<Review> getToReview() {
        return toReview;
    }

    /**
     * Set the list of feedback to write to review others authors
     *
     * @param toReview list of Review
     */
    public void setToReview(List<Review> toReview) {
        this.toReview = toReview;
    }

    /**
     * Get the list of feedback written by others authors
     *
     * @return
     */
    public List<Review> getReviewed() {
        return reviewed;
    }

    /**
     * Set the list of feedback written by others authors
     *
     * @param reviewed
     */
    public void setReviewed(List<Review> reviewed) {
        this.reviewed = reviewed;
    }
}
