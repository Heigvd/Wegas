/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.persistence.AcceptInjection;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.ReviewingNotStarted;
import com.wegas.editor.Visible;
import com.wegas.editor.view.ReviewStateSelectView;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Transient;

/**
 * Instance of the PeerReviewDescriptor variable Author:<br />
 * - has to review several other authors: <code>toReview</code> Review
 * list<br />
 * - is reviewed by several other authors: <code>reviewed</code> Review list The
 * review is in a specific state, see PeerReviewDescriptor
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 * @see PeerReviewDescriptor
 */
@Entity
public class PeerReviewInstance extends VariableInstance implements AcceptInjection {

    private static final long serialVersionUID = 1L;

    @JsonIgnore
    @Transient
    private Beanjection beans;

    /**
     * Current review state
     */
    @Enumerated(value = EnumType.STRING)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ReviewingNotStarted.class,
            view = @View(
                    label = "Review State",
                    value = ReviewStateSelectView.class))
    @Visible(VariableInstance.IsNotDefaultInstance.class)
    private PeerReviewDescriptor.ReviewingState reviewState = PeerReviewDescriptor.ReviewingState.NOT_STARTED;

    /**
     * List of review that contains feedback written by player owning this
     */
    @OneToMany(mappedBy = "reviewer", cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyArray.class,
            view = @View(label = "To review"))
    @Visible(VariableInstance.IsNotDefaultInstance.class)
    private List<Review> toReview = new ArrayList<>();

    /**
     * List of review that contains others feedback
     */
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyArray.class,
            view = @View(label = "Reviewed"))
    @Visible(VariableInstance.IsNotDefaultInstance.class)
    private List<Review> reviewed = new ArrayList<>();

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
        return this.toReview;
    }

    /**
     * Set the list of feedback to write to review others authors
     *
     * @param toReview list of Review
     */
    public void setToReview(List<Review> toReview) {
        this.toReview = toReview;
        for (Review review : toReview) {
            review.setReviewer(this);
        }
    }

    /**
     * @param r
     */
    public void addToToReview(Review r) {
        this.getToReview().add(r);
        r.setReviewer(this);
    }

    /**
     * Get the list of feedback written by others authors
     *
     * @return all feedbacks from others
     */
    public List<Review> getReviewed() {
        return this.reviewed;
    }

    /**
     * Set the list of feedback written by others authors
     *
     * @param reviewed
     */
    public void setReviewed(List<Review> reviewed) {
        this.reviewed = reviewed;

        for (Review review : reviewed) {
            review.setAuthor(this);
        }
    }

    public void addToReviewed(Review r) {
        this.getReviewed().add(r);
        r.setAuthor(this);
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        Collection<WegasPermission> ps = super.getRequieredReadPermission(context);

        // reviewer also have right to read
        for (Review r : getReviewed()) {
            // review may not be fully loaded yet...
            r.setBeanjection(this.beans);
            ps.addAll(r.getRequieredReadPermission(context));
        }
        // so authors have
        for (Review r : getToReview()) {
            // review may not be fully loaded yet...
            r.setBeanjection(this.beans);
            ps.addAll(r.getRequieredReadPermission(context));
        }
        return ps;
    }

    /**
     * Skip this {@link #getRequieredUpdatePermission() } implementation.
     * call super one.
     */
    private Collection<WegasPermission> getSuperRequieredUpdatePermission(RequestContext context) {
        return super.getRequieredUpdatePermission(context);
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        Collection<WegasPermission> ps = super.getRequieredUpdatePermission(context);
        for (Review r : getReviewed()) {
            // when they'er reviewing, reviewers also have right to write (optmisticlock = cascade on variableinstance !)
            if (r.getInitialReviewState().equals(Review.ReviewState.DISPATCHED)) {
                ps.addAll(r.getReviewer().getSuperRequieredUpdatePermission(context)); // avoid infinite loop
            }
        }
        for (Review r : getToReview()) {
            // when they'er commenting the feedback, authors also have right to write (optmisticlock = cascade on variableinstance !)
            if (r.getInitialReviewState().equals(Review.ReviewState.NOTIFIED)) {
                ps.addAll(r.getAuthor().getSuperRequieredUpdatePermission(context)); // avoid infinite loop
            }
        }
        return ps;
    }

    @Override
    public void setBeanjection(Beanjection beanjection) {
        this.beans = beanjection;
    }
}
