/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.rest.util.Views;
import com.wegas.reviewing.persistence.PeerReviewDescriptor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

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

    private static final Logger logger = LoggerFactory.getLogger(EvaluationDescriptorContainer.class);

    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    @JsonIgnore
    @OneToOne(mappedBy = "feedback")
    private PeerReviewDescriptor feedbacked;

    @JsonIgnore
    @OneToOne(mappedBy = "fbComments")
    private PeerReviewDescriptor commented;

    /**
     * List of evaluations
     */
    @OneToMany(mappedBy = "container", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @JsonView(Views.EditorI.class)
    @WegasEntityProperty
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
    }

    public PeerReviewDescriptor getCommented() {
        return commented;
    }

    public void setCommented(PeerReviewDescriptor commented) {
        this.commented = commented;
    }

    @JsonView(Views.IndexI.class)
    public Long getParentDescriptorId() {
        if (feedbacked != null) {
            return feedbacked.getId();
        } else if (commented != null) {
            return commented.getId();
        }
        return null;
    }

    public void setParentDescriptorId(Long id) {
    }

    /**
     * get the evaluation list
     *
     * @return list of EvaluationDescriptor
     */
    public List<EvaluationDescriptor> getEvaluations() {
        return evaluations;
    }

    /**
     * set the evaluation descriptions
     *
     * @param evaluations list of evaluation descriptor
     */
    public void setEvaluations(List<EvaluationDescriptor> evaluations) {
        this.evaluations = evaluations;
        for (EvaluationDescriptor ev : evaluations) {
            ev.setContainer(this);
        }
    }

    @Override
    public Long getId() {
        return id;
    }

}
