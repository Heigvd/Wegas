/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.AcceptInjection;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.view.Hidden;
import com.wegas.reviewing.persistence.evaluation.EvaluationInstance;
import java.util.*;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.NamedNativeQuery;
import javax.persistence.OneToMany;
import javax.persistence.Table;
import javax.persistence.Temporal;
import javax.persistence.TemporalType;
import javax.persistence.Transient;

/**
 * A review is linked to two PeerReviewInstnace : the one who reviews and the
 * original reviewed 'author' A review is composed of the feedback (written by
 * reviewers) and the feedback comments (written by author). Both are a list of
 * evaluation instances
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
    @Index(columnList = "author_id"),
    @Index(columnList = "reviewer_id")
})
@NamedNativeQuery(name = "Review.findOwners", query = "SELECT CASE WHEN player_id is not null THEN 'PLAYER' ELSE 'TEAM' END, COALESCE(player_id, team_id)  from review r join variableinstance vi on  vi.id = r.author_id or vi.id = r.reviewer_id  where r.id = ?1")
public class Review extends AbstractEntity implements DatedEntity, AcceptInjection {

    private static final long serialVersionUID = 1L;

    @JsonIgnore
    @Transient
    private Beanjection beans;

    /**
     * Review state:<ul>
     * <li>{@link #DISPATCHED}</li>
     * <li>{@link #REVIEWED}</li>
     * <li>{@link #NOTIFIED}</li>
     * <li>{@link #COMPLETED}</li>
     * <li>{@link #CLOSED}</li>
     * </ul>
     */
    public enum ReviewState {
        /**
         * Initial state : reviewer is revewing
         */
        DISPATCHED,
        /**
         * Just reviewed (no longer editable by reviewer, not yet viewable by author)
         */
        REVIEWED,
        /**
         * Author acquaint themself with the review and can comment it
         */
        NOTIFIED,
        /**
         * Author's comment is over
         */
        COMPLETED,
        /**
         * Reviewer acquaint thenself with author's comment
         */
        CLOSED
    }

    @Id
    @GeneratedValue
    private Long id;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(columnDefinition = "timestamp with time zone")
    private Date createdTime = new Date();

    /**
     * Current review state
     */
    @Enumerated(value = EnumType.STRING)
    private ReviewState reviewState;

    @JsonIgnore
    @Transient
    private ReviewState initialState;

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
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyArray.class,
            view = @View(value = Hidden.class, label ="FeedbacFeedbackk"))
    private List<EvaluationInstance> feedback = new ArrayList<>();

    /**
     * List of evaluation instances that compose the feedback evaluation
     * (writable by 'author' only)
     */
    @OneToMany(mappedBy = "commentsReview", cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyArray.class,
            view = @View(value = Hidden.class, label ="Comments"))
    private List<EvaluationInstance> comments = new ArrayList<>();

    @Override
    public Long getId() {
        return id;
    }

    /**
     * @return the createdTime
     */
    @Override
    public Date getCreatedTime() {
        return createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    /**
     * @param createdTime the createdTime to set
     */
    public void setCreatedTime(Date createdTime) {
        this.createdTime = createdTime != null ? new Date(createdTime.getTime()) : null;
    }

    /**
     * get Review status
     *
     * @return current review status
     */
    public ReviewState getReviewState() {
        return reviewState;
    }

    public ReviewState getInitialReviewState() {
        return initialState != null ? initialState : getReviewState();
    }

    /**
     * Set review state
     *
     * @param state
     */
    public void setReviewState(ReviewState state) {
        if (initialState == null) {
            // Keep a transient initial state to check permission against
            // such a transient  field will be reinitialised for each
            this.initialState = this.reviewState;
        }
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
        return this.feedback;
    }

    /**
     * set the list of evaluation instance composing the feedback
     *
     * @param feedback the list of evaluation instance composing the feedback
     */
    public void setFeedback(List<EvaluationInstance> feedback) {
        this.feedback = feedback;
        for (EvaluationInstance ei : feedback) {
            ei.setFeedbackReview(this);
        }
    }

    /**
     * get the list of evaluation instances composing the feedback comments
     *
     * @return the list of evaluation instances composing the feedback comments
     */
    public List<EvaluationInstance> getComments() {
        return this.comments;
    }

    /**
     * set the list of evaluation instance composing the feedback comments
     *
     * @param comments the list of evaluation instance composing the feedback
     *                 comments
     */
    public void setComments(List<EvaluationInstance> comments) {
        this.comments = comments;

        for (EvaluationInstance ei : comments) {
            ei.setCommentsReview(this);
        }
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        switch (getInitialReviewState()) {
            case DISPATCHED:
                // Only reviewer has edit right
                return this.getReviewer().getRequieredUpdatePermission();
            case NOTIFIED:
                // Only author has edit right
                return this.getAuthor().getRequieredUpdatePermission();
            case REVIEWED:
            case COMPLETED:
            case CLOSED:
            default:
                // only trainer or scenarist with write right on ethe game model
                // should be checked against the game, but it's quite equals
                return this.getReviewer().findDescriptor().getGameModel().getRequieredUpdatePermission();
        }
    }

    /*
    @Override
    public Collection<WegasPermission> getRequieredDeletePermission() {
        Collection<WegasPermission> p = new ArrayList<>();
        p.addAll(getReviewer().getRequieredUpdatePermission());
        p.addAll(getAuthor().getRequieredUpdatePermission());

        return p;
    }
     */

    @Override
    public WithPermission getMergeableParent() {
        return this.getAuthor();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        if (this.beans != null) {
            return beans.getReviewingFacade().getReviewReadPermission(this);
        } else {
            ArrayList<WegasPermission> p = new ArrayList<>(this.getAuthor().getRequieredReadPermission());
            p.addAll(this.getReviewer().getRequieredReadPermission());
            return p;
        }
    }

    @Override
    public void updateCacheOnDelete(Beanjection beans) {
        PeerReviewInstance theAuthor = this.getAuthor();
        PeerReviewInstance theReviewer = this.getReviewer();

        if (theAuthor != null) {
            theAuthor = (PeerReviewInstance) beans.getVariableInstanceFacade().find(theAuthor.getId());
            if (theAuthor != null) {
                theAuthor.getReviewed().remove(this);
            }
        }

        if (theReviewer != null) {
            theReviewer = (PeerReviewInstance) beans.getVariableInstanceFacade().find(theReviewer.getId());
            if (theReviewer != null) {
                theReviewer.getToReview().remove(this);
            }
        }
    }

    @Override
    public void setBeanjection(Beanjection beanjection) {
        this.beans = beanjection;
    }

}
