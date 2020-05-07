/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.view.Hidden;
import com.wegas.reviewing.ejb.ReviewingFacade;
import com.wegas.reviewing.persistence.Review;
import java.util.Collection;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.Transient;

/**
 * Evaluation instance is the abstract parent of different kind of evaluation.
 * <p>
 * such an instance is the effective evaluation that corresponding to an
 * EvaluationDescriptor
 * <p>
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
@Table(
        indexes = {
            @Index(columnList = "evaluationdescriptor_id"),
            @Index(columnList = "commentsreview_id"),
            @Index(columnList = "feedbackreview_id")
        })
public abstract class EvaluationInstance extends AbstractEntity {

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

    @Transient
    @WegasEntityProperty(
            optional = false, nullable = false,
            view = @View(value = Hidden.class, label = "Evaluation Name"))
    private String descriptorName;

    /**
     * Simple constructor
     */
    public EvaluationInstance() {
        // ensure there is an empty constructor
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

    /**
     * @return the descriptorName
     */
    @JsonIgnore
    public String getDescriptorName() {
        if (!Helper.isNullOrEmpty(descriptorName)) {
            return descriptorName;
        } else if (this.getDescriptor() != null) {
            return getDescriptor().getName();
        } else {
            return null;
        }
    }

    /**
     * @param descriptorName
     */
    public void setDescriptorName(String descriptorName) {
        this.descriptorName = descriptorName;
    }

    @Override
    public Long getId() {
        return this.id;
    }

    /**
     * @Override
     * @return index
     */
    @JsonProperty(access = JsonProperty.Access.READ_ONLY)
    @WegasExtraProperty(
            optional = false, nullable = false,
            view = @View(value = Hidden.class, label = ""))
    public int getIndex() {
        return this.getDescriptor() != null ? this.getDescriptor().getIndex() : 0;
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

    @Override
    public WithPermission getMergeableParent() {
        return this.getEffectiveReview();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getEffectiveReview().getRequieredUpdatePermission();
    }

    /*
    @Override
    public Collection<WegasPermission> getRequieredDeletePermission() {
        return this.getEffectiveReview().getRequieredDeletePermission();
    }*/
    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getEffectiveReview().getRequieredReadPermission();
    }
}
