/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence.input;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.I18nHtmlView;
import com.wegas.mcq.persistence.wh.WhQuestionDescriptor;
import com.wegas.survey.persistence.SurveyDescriptor;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Wrapper for grouping input descriptors by theme
 *
 * @author Jarle Hulaas
 * @see SurveyInputDescriptor
 * @see SurveyDescriptor
 */
@Entity
@Table(
        indexes = {
            @Index(columnList = "survey_id"),
            @Index(columnList = "description_id")
        }
)
public class SurveySectionDescriptor extends VariableDescriptor<SurveySectionInstance>
        implements DescriptorListI<SurveyInputDescriptor> {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(SurveySectionDescriptor.class);

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
    private TranslatableContent description;

    /**
     * to order sections
     */
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ValueGenerators.One.class,
            view = @View(label = "Index"))
    private Integer index;

    
    /**
     * The enclosing survey
     */
    //@JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference(value="survey-sections")
    private SurveyDescriptor survey;

    
    /**
     * List of questions/inputs of this section
     */
    @OneToMany(mappedBy = "section", cascade = {CascadeType.ALL})
    @OrderColumn(name = "index")
    @JsonManagedReference(value="input-section")
    //@JsonView(Views.EditorI.class)
    @WegasEntityProperty(
            includeByDefault = false,
            view = @View(value = Hidden.class, label = "Items"), notSerialized = true)
    @NotNull
    //@JsonIgnore
    private List<SurveyInputDescriptor> items = new ArrayList<>();

    /**
     * Empty constructor
     */
    public SurveySectionDescriptor() {

    }

    /**
     * get items (i.e. list of inputs)
     *
     * @return list of SurveyInputDescriptor
     */
    @Override
    @JsonView(Views.ExportI.class)
    public List<SurveyInputDescriptor> getItems() {
        return this.items;
    }

    public void setItems(List<SurveyInputDescriptor> items) {
        this.items = items;
        for (SurveyInputDescriptor sid : items) {
            sid.setSection(this);
        }
    }

    public int getIndex() {
        return index != null ? index : 0;
    }

    public void setIndex(int index) {
        this.index = index;
    }

    
    public TranslatableContent getDescription() {
        return description;
    }

    public void setDescription(TranslatableContent description) {
        this.description = description;
        if (this.description != null) {
            this.description.setParentDescriptor(this);
        }
    }

    public SurveyDescriptor getSurvey() {
        return survey;
    }
    
    //@JsonBackReference
    public void setSurvey(SurveyDescriptor survey) {
        this.survey = survey;
        logger.trace("set {} survey to {}", this, this.survey);
        if (survey != null) {
            //this.setItems(items);
            this.setDescription(description);
            this.setRoot(null);
            this.setParentList(null);
            this.setParentWh(null);
        }
    }

    
    @JsonIgnore
    @Override
    public DescriptorListI<? extends VariableDescriptor> getParentOrNull() {
        if (this.getSurvey() != null) {
            return this.getSurvey();
        } else {
            return super.getParentOrNull();
        }
    }

    @JsonIgnore
    @Override
    public DescriptorListI<? extends VariableDescriptor> getParent() {
        if (this.getSurvey() != null) {
            return this.getSurvey();
        } else {
            return super.getParent();
        }
    }

    /**
     *
     * @param item
     */
    @Override
    public void setChildParent(SurveyInputDescriptor item) {
        item.setSection(this);
    }

    @Override
    public void resetItemsField() {
        this.items = new ArrayList<>();
    }

    /*
    @JsonIgnore
    public SurveyDescriptor getParent() {
        return survey;
    }
    */

    @Override
    public WithPermission getMergeableParent() {
        return this.getSurvey();
    }

    
    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getSurvey().getRequieredUpdatePermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getSurvey().getRequieredReadPermission();
    }
    
    
    @Override
    public void setRoot(GameModel rootGameModel) {
        super.setRoot(rootGameModel);
        if (this.getRoot() != null) {
            this.setSurvey(null);
        }
    }

    @Override
    public void setParentList(ListDescriptor parentList) {
        super.setParentList(parentList);
        if (this.getParentList() != null) {
            this.setSurvey(null);
        }
    }

    @Override
    public void setParentWh(WhQuestionDescriptor parentWh) {
        logger.trace("*** SurveySectionDescriptor.setParentWH {}", parentWh);
        super.setParentWh(parentWh);
        if (this.getParentWh() != null) {
            this.setSurvey(null);
        }
    }

    /*
    public static class SurveySectionDescriptorMergeCallback implements WegasCallback {

        @Override
        public void postUpdate(IMergeable entity, Object ref, Object identifier) {
            if (entity instanceof SurveySectionDescriptor) {
                SurveySectionDescriptor ssd = (SurveySectionDescriptor) entity;
                // set names and labels unique
                Helper.setNameAndLabelForLabelledEntityList(ssd.getItems(), "items", ssd.getGameModel());
            }
        }

    }

    public static class SurveyInputMergeCallback implements WegasCallback {

        @Override
        public Object remove(Object entity, IMergeable container, Object identifier) {
            if (entity instanceof SurveyInputDescriptor) {
                SurveyInputDescriptor inputToRemove = (SurveyInputDescriptor) entity;
                inputToRemove.updateCacheOnDelete(inputToRemove.getSection().beans);
            }
            return null;
        }
    }
    */
}