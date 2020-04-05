/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence.input;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.wegas.core.exception.client.WegasConflictException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators;
import static java.lang.Boolean.TRUE;
import com.wegas.editor.View.I18nHtmlView;
import com.wegas.mcq.persistence.wh.WhQuestionDescriptor;
import java.util.Collection;
import javax.persistence.*;


/**
 *
 * A survey input descriptor is the abstract parent of different kinds of
 * input descriptors.
 *
 * @author Jarle Hulaas
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
@Table(
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"section_id", "name"})
        },
        indexes = {
            @Index(columnList = "section_id"),
            @Index(columnList = "description_id"),
        }
)
@JsonSubTypes(value = {
    @JsonSubTypes.Type(value = SurveyTextDescriptor.class),
    @JsonSubTypes.Type(value = SurveyChoicesDescriptor.class),
    @JsonSubTypes.Type(value = SurveyNumberDescriptor.class)
})
public abstract class SurveyInputDescriptor
        extends VariableDescriptor<SurveyInputInstance> {

    private static final long serialVersionUID = 1L;
    private static final String mustBeInsideSection = "A SurveyInputDescriptor can only exist inside a SurveySectionDescriptor";

    /**
     * To order questions/inputs
     */
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ValueGenerators.One.class,
            view = @View(label = "Index"))
    protected Integer index;

    /**
     * Textual descriptor to be displayed to players
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ValueGenerators.EmptyI18n.class,
            view = @View(
                    label = "Description",
                    value = I18nHtmlView.class
            ))
    protected TranslatableContent description;

    /**
     * Tells if a reply to this input/question is compulsory
     */
    @Column(columnDefinition = "boolean default true")
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ValueGenerators.True.class,
            view = @View(label = "Reply is compulsory"))
    private Boolean isCompulsory = TRUE;
   
    /**
     * Parent section of this input:
     */
    @ManyToOne
    @JsonBackReference(value="input-section")
    protected SurveySectionDescriptor section;

    /**
     * Basic constructor
     */
    public SurveyInputDescriptor() {

    }

    /**
     * Constructor with name
     *
     * @param name evaluation name
     */
    public SurveyInputDescriptor(String name) {
        this.name = name;
    }

    public int getIndex() {
        return index != null ? index : 0;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    
    /**
     * Return the internal name of the question/input
     *
     * @return input name
     */
    /*
    @Override
    public String getName() {
        return this.name;
    }
    */

    /**
     * Set the question/input internal name
     *
     * @param name the name to set
     */
    /*
    @Override
    public void setName(String name) {
        this.name = name;
    }
    */

    public TranslatableContent getDescription() {
        return description;
    }

    public void setDescription(TranslatableContent description) {
        this.description = description;
        if (this.description != null) {
            this.description.setParentDescriptor(this);
        }
    }

    public Boolean getIsCompulsory() {
        return isCompulsory;
    }
    
    public void setIsCompulsory(Boolean isCompulsory) {
        this.isCompulsory = isCompulsory;
    }
    
    /**
     * @return the section that contains this question/input
     */
    // @JsonIgnore
    public SurveySectionDescriptor getSection() {
        return this.section;
    }

    /**
     * Set the section this question/input descriptor belongs to.
     *
     * @param section the parent
     */
    public void setSection(SurveySectionDescriptor section) {
        this.section = section;
        logger.trace("set {} section to {}", this, this.section);
        if (this.section != null) {
            // revive translatable content link
            //this.setLabel(label);
            this.setDescription(description);
            this.setRoot(null);
            this.setParentList(null);
            this.setParentWh(null);
        }
    }
    
    
    
    
    @JsonIgnore
    @Override
    public DescriptorListI<? extends VariableDescriptor> getParentOrNull() {
        if (this.getSection() != null) {
            return this.getSection();
        } else {
            return super.getParentOrNull();
        }
    }

    @JsonIgnore
    @Override
    public DescriptorListI<? extends VariableDescriptor> getParent() {
        if (this.getSection() != null) {
            return this.getSection();
        } else {
            return super.getParent();
        }
    }

    
    @Override
    public WithPermission getMergeableParent() {
        return getSection();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getMergeableParent().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getMergeableParent().getRequieredReadPermission();
    }    
    
    
    @Override
    public void setRoot(GameModel rootGameModel) {
        super.setRoot(rootGameModel);
        if (this.getRoot() != null) {
            throw new WegasConflictException(mustBeInsideSection);
            //this.setSection(null);
        }
    }

    @Override
    public void setParentList(ListDescriptor parentList) {
        super.setParentList(parentList);
        if (this.getParentList() != null) {
            throw new WegasConflictException(mustBeInsideSection);
            //this.setSection(null);
        }
    }

    @Override
    public void setParentWh(WhQuestionDescriptor parentWh) {
        super.setParentWh(parentWh);
        if (this.getParentWh() != null) {
            throw new WegasConflictException(mustBeInsideSection);
            //this.setSection(null);
        }
    }

}
