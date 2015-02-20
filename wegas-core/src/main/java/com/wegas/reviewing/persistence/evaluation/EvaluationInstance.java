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
import com.wegas.core.persistence.AbstractEntity;
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
 * (through feedbackReview 'field' or as member of the feedbackEvaluation
 * (through the 'feedbackEvaluationReview')
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
public abstract class EvaluationInstance extends AbstractEntity {

    private static final long serialVersionUID = 1L;

    @Id
    private Long id;

    @ManyToOne
    private Review feedbackReview;

    @ManyToOne
    private Review feedbackEvaluationReview;

    @ManyToOne
    private EvaluationDescriptor evaluationDescriptor;

    public EvaluationInstance() {
    }

    public EvaluationInstance(EvaluationDescriptor ed){
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
    public void setEvaluationDescriptor(EvaluationDescriptor ed) {
        this.evaluationDescriptor = ed;
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof EvaluationInstance) {
            EvaluationInstance o = (EvaluationInstance) a;
        }
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
     * Get the Review that contains this evaluation instance as a
     * feedbackEvaluation one
     *
     * @return return the parent or NULL if it's not a feedbackEvaluation
     *         evaluation
     */
    @JsonIgnore
    public Review getFeedbackEvaluationReview() {
        return this.feedbackEvaluationReview;
    }

    /**
     * Set the Review that contains this evaluation instance as a
     * feedbackEvaluation one
     *
     * @param rd the parent
     */
    public void setFeedbackEvaluationReview(Review rd) {
        this.feedbackEvaluationReview = rd;
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
}
