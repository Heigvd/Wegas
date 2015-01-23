/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.NamedEntity;
import com.wegas.reviewing.persistence.PeerReviewingDescriptor;
import java.util.List;
import java.util.Objects;
import javax.persistence.*;
import org.codehaus.jackson.annotate.JsonIgnore;
import org.codehaus.jackson.annotate.JsonSubTypes;

/**
 *
 * An evaluation descriptor is the abstract parent of different kind of
 * evaluation description.
 *
 * Such en evaluation is either one that compose a feedback (ie the review of a
 * variable) or one that compose a feedback evaluation (ie the evaluation of a
 * review of a variable)
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 * @param <T> corresponding Evaluation Instance
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(uniqueConstraints = {})
@JsonSubTypes(value = {
    @JsonSubTypes.Type(value = TextEvaluationDescriptor.class),
    @JsonSubTypes.Type(value = CategorizedEvaluationDescriptor.class),
    @JsonSubTypes.Type(value = GradeDescriptor.class)
})
public abstract class EvaluationDescriptor<T extends EvaluationInstance> extends NamedEntity {

    @OneToMany(mappedBy = "evaluationDescriptor")
    private List<EvaluationInstance> evaluationInstances;

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    private Long id;

    /**
     * Evaluation name as displayed to players
     */
    private String name;

    /**
     * Indicates that the parent PeerReviewingDescriptor defined this evaluation
     * as composing a feedback
     */
    @ManyToOne
    private PeerReviewingDescriptor feedbackReviewDescriptor;

    /**
     * Indicates that the parent PeerReviewingDescriptor defined this evaluation
     * as composing a feedback evaluation
     */
    @ManyToOne
    private PeerReviewingDescriptor feedbackEvaluationReviewDescriptor;

    /**
     * Basic constructor
     */
    public EvaluationDescriptor() {
    }

    /**
     * Constructor with name
     *
     * @param name evaluation name
     */
    public EvaluationDescriptor(String name) {
        this.name = name;
    }

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        super.merge(a);
        if (a instanceof EvaluationDescriptor) {
            EvaluationDescriptor o = (EvaluationDescriptor) a;
        }
    }

    @Override
    public boolean equals(Object o) {
        if (o instanceof EvaluationDescriptor) {
            EvaluationDescriptor ed = (EvaluationDescriptor) o;

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
        hash = 53 * hash + Objects.hashCode(this.name);
        return hash;
    }

    /**
     * Return the name of the evaluation
     *
     * @return evaluation name
     */
    @Override
    public String getName() {
        return this.name;
    }

    /**
     * Set the evaluation name
     *
     * @param name the name to set
     */
    @Override
    public void setName(String name) {
        this.name = name;
    }

    /**
     * get the evaluation unique ID
     *
     * @return unique id
     */
    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @return the review descriptor that define this evaluation as composing
     *         the feedback evaluation
     */
    @JsonIgnore
    public PeerReviewingDescriptor getFeedbackEvaluationReviewDescriptor() {
        return this.feedbackEvaluationReviewDescriptor;
    }

    /**
     * Set the review descriptor that contains this evaluation descriptor as
     * composing the feedback evaluation
     *
     * @param rd the parent
     */
    public void setFeedbackEvaluationReviewDescriptor(PeerReviewingDescriptor rd) {
        this.feedbackEvaluationReviewDescriptor = rd;
    }

    /**
     * @return the review descriptor that define this evaluation as composing
     *         the feedback
     */
    @JsonIgnore
    public PeerReviewingDescriptor getFeedbackReviewDescriptor() {
        return feedbackReviewDescriptor;
    }

    /**
     * Set the review descriptor that contains this evaluation descriptor
     *
     * @param rd the parent
     */
    public void setFeedbackReviewDescriptor(PeerReviewingDescriptor rd) {
        this.feedbackReviewDescriptor = rd;
    }
}
