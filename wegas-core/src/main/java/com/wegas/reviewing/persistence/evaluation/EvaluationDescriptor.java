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
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.Helper;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationContentDeserializer;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.WithPermission;
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
        extends AbstractEntity implements LabelledEntity {

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
    @WegasEntityProperty
    private Integer index;

    /**
     * Evaluation internal identifier
     */
    @WegasEntityProperty(searchable = true)
    private String name;

    /**
     * Evaluation label as displayed to players
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonDeserialize(using = TranslationContentDeserializer.class)
    @WegasEntityProperty
    private TranslatableContent label;

    /**
     * Textual descriptor to be displayed to players
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonDeserialize(using = TranslationContentDeserializer.class)
    @WegasEntityProperty
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
        if (this.container != null){
            // revive translatable content link
            this.setLabel(label);
            this.setDescription(description);
        }
    }

    /**
     * 
     * @return 
     */
    @JsonView(Views.IndexI.class)
    public Long getParentDescriptorId() {
        if (this.getContainer() != null) {
            return this.getContainer().getParentDescriptorId();
        }
        return null;
    }

    public void setParentDescriptorId(Long id){
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

    @Override
    public WithPermission getMergeableParent(){
        return getContainer();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getMergeableParent().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getMergeableParent().getRequieredReadPermission();
    }
}
