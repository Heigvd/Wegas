/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence.input;

import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.Helper;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.I18nHtmlView;
import com.wegas.mcq.persistence.wh.WhQuestionDescriptor;
import com.wegas.survey.persistence.SurveyDescriptor;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.OneToMany;
import javax.persistence.OneToOne;
import javax.persistence.Table;
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
     * The enclosing survey
     */
    //@JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JsonBackReference(value = "survey-sections")
    private SurveyDescriptor survey;

    /**
     * List of questions/inputs of this section
     */
    @OneToMany(mappedBy = "section", cascade = {CascadeType.ALL})
    @JsonManagedReference(value = "input-section")
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
        // ensure there is an empty constructor
    }

    /**
     * get items (i.e. list of inputs)
     *
     * @return list of SurveyInputDescriptor
     */
    @Override
    @JsonView(Views.ExportI.class)
    @Scriptable(label = "getItems", wysiwyg = false)
    public List<SurveyInputDescriptor> getItems() {
        return Helper.copyAndSortModifiable(this.items, new EntityComparators.OrderComparator<>());
    }

    @JsonIgnore
    @Override
    public List<SurveyInputDescriptor> getRawItems() {
        return items;
    }

    @Override
    public void setGameModel(GameModel gm) {
        super.setGameModel(gm);
        for (SurveyInputDescriptor ssd : this.getRawItems()) {
            ssd.setGameModel(gm);
        }
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
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        return this.getSurvey().getRequieredUpdatePermission(context);
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return this.getSurvey().getRequieredReadPermission(context);
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

    // ~~~~~~ Sugar for scripts ~~~~~~~~
    /**
     *
     * @param p
     */
    @Scriptable
    public void activate(Player p) {
        this.getInstance(p).setActive(true);
    }

    /**
     *
     * @param p
     */
    @Scriptable
    public void deactivate(Player p) {
        this.getInstance(p).setActive(false);
    }

    /**
     *
     * @param p
     *
     * @return true if the player's survey is active
     */
    @Scriptable(label = "is active")
    public boolean isActive(Player p) {
        return this.getInstance(p).getActive();
    }

    /**
     * {@link #isActive ...}
     *
     * @param p
     *
     * @return true if the player's survey is not active
     */
    @Scriptable(label = "is not active")
    public boolean isNotActive(Player p) {
        return this.getInstance(p).getActive() == false;
    }
}
