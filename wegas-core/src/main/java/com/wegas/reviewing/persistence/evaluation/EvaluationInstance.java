/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.rest.util.Views;
import com.wegas.reviewing.ejb.ReviewingFacade;
import com.wegas.reviewing.persistence.Review;
import java.util.Objects;
import javax.persistence.*;

/**
 * Evaluation instance is the abstract parent of different kind of evaluation.
 *
 * such an instance is the effective evaluation that corresponding to an
 * EvaluationDescriptor
 *
 * An evaluation instance belongs to a review, either as member of the feedback
 * (through feedbackReview 'field' or as member of the feedback comments
 * (through the 'commentsReview')
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@JsonSubTypes(value = {
    @JsonSubTypes.Type(value = TextEvaluationInstance.class),
    @JsonSubTypes.Type(value = CategorizedEvaluationInstance.class),
    @JsonSubTypes.Type(value = GradeInstance.class)
})
public abstract class EvaluationInstance extends AbstractEntity /*implements Broadcastable */ {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     * the parent review if this evaluation instance belongs to a feedback null
     * otherwise
     */
    @ManyToOne
    @JsonIgnore
    private Review feedbackReview;

    /**
     * the parent review if this evaluation instance belongs to a comments null
     * otherwise
     */
    @ManyToOne
    @JsonIgnore
    private Review commentsReview;

    /**
     * Corresponding evaluation descriptor
     */
    @ManyToOne
    private EvaluationDescriptor evaluationDescriptor;

    /**
     * Simple constructor
     */
    public EvaluationInstance() {
    }

    /**
     * Instantiate from EvaluationDescriptor
     *
     * @param ed
     */
    public EvaluationInstance(EvaluationDescriptor ed) {
        this.evaluationDescriptor = ed;
    }

    /**
     * Get the descriptor that drive this evaluation instance
     *
     * @return corresponding EvaluationDescriptor
     */
    public EvaluationDescriptor getDescriptor() {
        return evaluationDescriptor;
    }

    /**
     * Set the descriptor that drive this evaluation instance
     *
     * @param ed corresponding EvaluationDescriptor
     */
    public void setDescriptor(EvaluationDescriptor ed) {
        this.evaluationDescriptor = ed;
    }

    @Override
    public void merge(AbstractEntity a) {
        //if (a instanceof EvaluationInstance) {
        //EvaluationInstance o = (EvaluationInstance) a;
        // Nothing to merge
        //}
    }

    @Override
    public boolean equals(Object o) {
        if (o instanceof EvaluationInstance) {
            EvaluationInstance ed = (EvaluationInstance) o;

            if (ed.getId() == null || this.getId() == null) {
                return false;
            } else {
                return this.getId().equals(ed.getId());
            }
        } else {
            return false;
        }
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 53 * hash + Objects.hashCode(this.id);
        return hash;
    }

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * Return the effective parent
     *
     * @return commentsReview if not null, feedbackReview otherwise
     */
    @JsonIgnore
    public Review getEffectiveReview() {
        if (this.getCommentsReview() != null) {
            return this.getCommentsReview();
        } else {
            return this.getFeedbackReview();
        }
    }

    /**
     * Get the Review that contains this evaluation instance as a feedback
     * component
     *
     * @return return the parent or NULL if it's not a review comment evaluation
     */
    @JsonIgnore
    public Review getCommentsReview() {
        return this.commentsReview;
    }

    /**
     * Set the Review that contains this evaluation instance as a feedback
     * comments
     *
     * @param rd the parent
     */
    public void setCommentsReview(Review rd) {
        this.commentsReview = rd;
    }

    /**
     * Get the Review that contains this evaluation instance as a feedback one
     *
     * @return return the parent or NULL if it's not a feedback evaluation
     */
    @JsonIgnore
    public Review getFeedbackReview() {
        return feedbackReview;
    }

    /**
     * Set the review descriptor that contains this evaluation descriptor as a
     * feedback one
     *
     * @param rd the parent
     */
    public void setFeedbackReview(Review rd) {
        this.feedbackReview = rd;
    }

    /*@Override
    public Map<String, List<AbstractEntity>> getEntities() {
        if (feedbackReview != null) {
            return feedbackReview.getEntities();
        } else if (commentsReview != null) {
            return commentsReview.getEntities();
        } else {
            return null;
        }
    }*/
    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        ReviewingFacade rF = beans.getReviewingFacade();
        EvaluationDescriptor descriptor = this.getDescriptor();
        if (descriptor != null) {
            descriptor = rF.findEvaluationDescriptor(descriptor.getId());
            if (descriptor != null) {
                descriptor.removeInstance(this);
            }
        }
        Review theReview = this.getFeedbackReview();
        if (theReview != null) {
            theReview = rF.findReview(theReview.getId());
            if (theReview != null) {
                theReview.getFeedback().remove(this);
            }
        }

        theReview = this.getCommentsReview();
        if (theReview != null) {
            theReview = rF.findReview(theReview.getId());
            if (theReview != null) {
                theReview.getComments().remove(this);
            }
        }
        super.updateCacheOnDelete(beans);
    }
}
