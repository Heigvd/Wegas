/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.view.Hidden;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.validation.constraints.NotNull;

/**
 * Simple wrapper to group several evaluation descriptor
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 * @see EvaluationDescriptor
 * @see PeerReviewDescriptor
 */
@Entity
public class EvaluationDescriptorContainer extends AbstractEntity {

    private static final long serialVersionUID = 1L;


    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, mappedBy = "feedback")
    private PeerReviewDescriptor feedbacked;

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY, mappedBy = "fbComments")
    private PeerReviewDescriptor commented;

    /**
     * List of evaluations
     */
    @OneToMany(mappedBy = "container", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        view = @View(value = Hidden.class, label = ""))
    @NotNull
    private List<EvaluationDescriptor> evaluations = new ArrayList<>();

    /**
     * Empty constructor
     */
    public EvaluationDescriptorContainer() {
        super();
    }

    public PeerReviewDescriptor getFeedbacked() {
        return feedbacked;
    }

    public void setFeedbacked(PeerReviewDescriptor feedbacked) {
        this.feedbacked = feedbacked;
        if (this.feedbacked != null) {
            this.setEvaluations(evaluations);
        }
    }

    public PeerReviewDescriptor getCommented() {
        return commented;
    }

    public void setCommented(PeerReviewDescriptor commented) {
        this.commented = commented;
        if (this.commented != null) {
            this.setEvaluations(evaluations);
        }
    }

    @JsonIgnore
    public PeerReviewDescriptor getParent() {
        if (this.feedbacked != null) {
            return feedbacked;
        } else {
            return commented;
        }
    }

    /**
     * get the evaluation list
     *
     * @return list of EvaluationDescriptor
     */
    public List<EvaluationDescriptor> getEvaluations() {
        return Helper.copyAndSortModifiable(this.evaluations, new EntityComparators.OrderComparator<>());
    }

    /**
     * set the evaluation descriptions
     *
     * @param evaluations list of evaluation descriptor
     */
    public void setEvaluations(List<EvaluationDescriptor> evaluations) {
        this.evaluations = evaluations;
        int i = 0;
        for (EvaluationDescriptor ed : this.evaluations) {
            ed.setIndex(i++);
            ed.setContainer(this);
        }
    }

    @Override
    public Long getId() {
        return id;
    }

    /**
     * back reference to PeerReviewDescriptor through FbPRD or CommentsPRD
     *
     * @return
     */
    private PeerReviewDescriptor getEffectiveDescriptor() {
        if (this.getFeedbacked() != null) {
            return this.getFeedbacked();
        } else {
            return this.getCommented();
        }
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getEffectiveDescriptor();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getEffectiveDescriptor().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getEffectiveDescriptor().getRequieredReadPermission();
    }
}
