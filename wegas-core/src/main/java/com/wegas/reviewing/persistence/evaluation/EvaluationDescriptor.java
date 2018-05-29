/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationDeserializer;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import java.util.List;
import javax.persistence.*;

/**
 *
 * An evaluation descriptor is the abstract parent of different kind of
 * evaluation description.
 * <p>
 * Such en evaluation is either one that compose a feedback (ie the review of a
 * variable) or one that compose a feedback evaluation (ie the evaluation of a
 * review of a variable)
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 * @param <T> corresponding Evaluation Instance
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"container_id", "name"}),
            @UniqueConstraint(columnNames = {"container_id", "label"}),},
        indexes = {
            @Index(columnList = "container_id"),
            @Index(columnList = "label_id"),
            @Index(columnList = "description_id")
        }
)
@JsonSubTypes(value = {
    @JsonSubTypes.Type(value = TextEvaluationDescriptor.class),
    @JsonSubTypes.Type(value = CategorizedEvaluationDescriptor.class),
    @JsonSubTypes.Type(value = GradeDescriptor.class)
})
public abstract class EvaluationDescriptor<T extends EvaluationInstance>
        extends AbstractEntity implements LabelledEntity, Searchable {

    @OneToMany(mappedBy = "evaluationDescriptor", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<EvaluationInstance> evaluationInstances;

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     * to sort evaluation descriptor and instance
     */
    private Integer index;

    /**
     * Evaluation internal identifier
     */
    private String name;

    /**
     * Evaluation label as displayed to players
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonDeserialize(using = TranslationDeserializer.class)
    private TranslatableContent label;

    /**
     * Textual descriptor to be displayed to players
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonDeserialize(using = TranslationDeserializer.class)
    private TranslatableContent description;

    /**
     * the parent,
     */
    @ManyToOne
    @JsonBackReference
    private EvaluationDescriptorContainer container;

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

    public int getIndex() {
        return index != null ? index : 0;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof EvaluationDescriptor) {
            EvaluationDescriptor o = (EvaluationDescriptor) a;
            this.setName(o.getName());
            this.setLabel(TranslatableContent.merger(this.getLabel(), o.getLabel()));
            this.setDescription(TranslatableContent.merger(this.getDescription(), o.getDescription()));
            this.setIndex(o.getIndex());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    @Override
    public TranslatableContent getLabel() {
        return label;
    }

    @Override
    public void setLabel(TranslatableContent label) {
        this.label = label;
        if (this.label != null && this.getContainer() != null) {
            this.label.setParentDescriptor(this.getContainer().getParent());
        }
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

    public TranslatableContent getDescription() {
        return description;
    }

    public void setDescription(TranslatableContent description) {
        this.description = description;
        if (this.description != null && this.getContainer() != null) {
            this.description.setParentDescriptor(this.getContainer().getParent());
        }
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
     * @return the container that define this evaluation
     */
    @JsonIgnore
    public EvaluationDescriptorContainer getContainer() {
        return this.container;
    }

    /**
     * Set the evaluation descriptor owner
     *
     * @param container the parent
     */
    public void setContainer(EvaluationDescriptorContainer container) {
        this.container = container;
    }

    @JsonIgnore
    public List<EvaluationInstance> getEvaluationInstances() {
        return evaluationInstances;
    }

    public void setEvaluationInstances(List<EvaluationInstance> evaluationInstances) {
        this.evaluationInstances = evaluationInstances;
    }

    /**
     * Create an EvaluationInstance
     *
     * @return new evaluationInstance
     */
    @JsonIgnore
    public T createInstance() {
        T newInstance = this.newInstance();
        newInstance.setDescriptor(this);
        this.evaluationInstances.add(newInstance);
        return newInstance;
    }

    /**
     * Create an EvaluationInstance
     *
     * @return new evaluationInstance
     */
    protected abstract T newInstance();

    public void removeInstance(EvaluationInstance instance) {
        this.evaluationInstances.remove(instance);
    }

    private WithPermission getEffectiveContainer() {
        return this.getContainer();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getEffectiveContainer().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getEffectiveContainer().getRequieredReadPermission();
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        return  Helper.insensitiveContainsAll(getName(), criterias)
                || Helper.insensitiveContainsAll(getLabel(), criterias)
                || Helper.insensitiveContainsAll(getDescription(), criterias);
    }
}
