/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * Instance of the PeerReviewingDescriptor variable

 Author:
  - has to review several other authors: toReview Review list
  - is reviewed by several other authors: reviewed Review list
 
 The review is in a specific state, see PeerReviewingDescriptor 
 * 
 * 
 * @see PeerReviewingDescriptor
 * 
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Entity
public class PeerReviewingInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(PeerReviewingInstance.class);

    private PeerReviewingDescriptor.ReviewingState reviewState;


    @OneToMany(mappedBy = "reviewer")
    private List<Review> toReview = new ArrayList<>();
    
    @OneToMany(mappedBy = "reviewed")
    private List<Review> reviewed = new ArrayList<>();
    

    /**
     *
     */
    public PeerReviewingInstance() {
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        PeerReviewingInstance vi = (PeerReviewingInstance) a;
    }

    public PeerReviewingDescriptor.ReviewingState getReviewState() {
        return reviewState;
    }

    public void setReviewState(PeerReviewingDescriptor.ReviewingState state) {
        this.reviewState = state;
    }

    /**
     * Get the list of feedback to write to review others authors
     * @return the list of feedback 
     */
    public List<Review> getToReview() {
        return toReview;
    }

    /**
     * Set the list of feedback to write to review others authors
     * @param toReview list of Review
     */
    public void setToReview(List<Review> toReview) {
        this.toReview = toReview;
    }

    /**
     * Get the list of feedback written by others authors
     * @return 
     */
    public List<Review> getReviewed() {
        return reviewed;
    }

    /**
     * Set the list of feedback written by others authors
     * @param reviewed 
     */
    public void setReviewed(List<Review> reviewed) {
        this.reviewed = reviewed;
    }
}
