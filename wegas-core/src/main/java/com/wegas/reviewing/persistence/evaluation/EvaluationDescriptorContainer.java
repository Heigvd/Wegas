/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.reviewing.persistence.*;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.rest.util.Views;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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

    /**
     * List of evaluations
     */
    @OneToMany(mappedBy = "container", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @JsonView(Views.EditorI.class)
    private List<EvaluationDescriptor> evaluations = new ArrayList<>();

    @JsonIgnore
    @OneToOne
    private PeerReviewDescriptor parent;

    /**
     *
     */
    public EvaluationDescriptorContainer() {
        super();
    }

    /**
     *
     * @param a another PeerReviewDescriptor
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof EvaluationDescriptorContainer) {
            EvaluationDescriptorContainer other = (EvaluationDescriptorContainer) a;
            this.evaluations = ListUtils.mergeLists(this.getEvaluations(), other.getEvaluations());
        }
    }

    /**
     * Get the parent
     *
     * @return the parent
     */
    public PeerReviewDescriptor getParent() {
        return parent;
    }

    /**
     * set the parent
     *
     * @param parent
     */
    public void setParent(PeerReviewDescriptor parent) {
        this.parent = parent;
    }

    /**
     * Get the parent
     *
     * @return the parent
     */
    @JsonView(Views.IndexI.class)
    public Long getParentId() {
        if (parent != null) {
            return parent.getId();
        } else {
            return -1L;
        }
    }

    /**
     * set the parent
     *
     * @param id
     */
    public void setParentId(Long id) {
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
     *
     * set the evaluation descriptions
     *
     * @param evaluations list of evaluation descriptor
     */
    public void setEvaluations(List<EvaluationDescriptor> evaluations) {
        this.evaluations = evaluations;
    }

    @Override
    public Long getId() {
        return id;
    }

}
