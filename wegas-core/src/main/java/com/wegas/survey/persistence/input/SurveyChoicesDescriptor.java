/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence.input;

import ch.albasim.wegas.annotations.CommonView;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.variable.primitive.EnumItem;
import com.wegas.core.persistence.variable.primitive.Enumeration;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.Visible;
import com.wegas.editor.view.ArrayView;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.NumberView;
import com.wegas.mcq.persistence.QuestionDescriptor;
import static java.lang.Boolean.FALSE;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToMany;

/**
 * Define a survey input as a labeled choice. For instance : [ very bad ; bad ; acceptable ; good ;
 * very good ], [true ; false]
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 * @author Jarle Hulaas
 */
@Entity
public class SurveyChoicesDescriptor
    extends SurveyInputDescriptor
    implements Enumeration {

    private static final long serialVersionUID = 1L;

    /**
     * List of allowed choices
     */
    @OneToMany(mappedBy = "parentSurveyChoice", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonDeserialize(using = EnumItem.ListDeserializer.class)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        view = @View(label = "Choices", value = ArrayView.HighlightAndSortable.class))
    private List<EnumItem> choices = new ArrayList<>();

    /**
     * Maximum number of allowed values a user can select
     */
    @WegasEntityProperty(proposal = ValueGenerators.One.class,
        view = @View(
            label = "Maximum selectable",
            layout = CommonView.LAYOUT.shortInline,
            value = NumberView.WithOnePlaceholder.class,
            index = 1
        ))
    @Errored(QuestionDescriptor.CheckPositiveness.class)
    @Visible(StringDescriptor.IsEnumeration.class)
    private Integer maxSelectable = 1;

    /**
     * Tells if these choices should be presented as a scale
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.False.class,
        view = @View(label = "Present as a scale", value = Hidden.class))
    private Boolean isScale = FALSE;

    /**
     * Tells if these choices should be presented as an analog slider
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.False.class,
        view = @View(label = "Present as a slider", value = Hidden.class))
    private Boolean isSlider = FALSE;

    // Default constructor:
    public SurveyChoicesDescriptor() {
        // ensure there is an empty constructor
    }

    public Integer getMaxSelectable() {
        return maxSelectable;
    }

    public void setMaxSelectable(Integer maxSelectable) {
        this.maxSelectable = maxSelectable;
    }

    public Boolean getIsScale() {
        return isScale;
    }

    public void setIsScale(Boolean isScale) {
        this.isScale = isScale;
    }

    public Boolean getIsSlider() {
        return isSlider;
    }

    public void setIsSlider(Boolean isSlider) {
        this.isSlider = isSlider;
    }

    /**
     * Get the list of allowed choices
     *
     * @return allowed choices
     */
    public List<EnumItem> getChoices() {
        return this.getSortedEnumItems();
    }

    @Override
    public List<EnumItem> getEnumItems() {
        return this.choices;
    }

    /**
     * set the list of allowed choices
     *
     * @param choices allowed choices
     */
    public void setChoices(List<EnumItem> choices) {
        this.choices = choices;
        if (choices != null) {
            int i = 0;
            for (EnumItem category : this.choices) {
                category.setOrder(i++);
                registerItem(category);
            }
        }
    }

    @Override
    public void registerItem(EnumItem item) {
        item.setParentSurveyChoice(this);
        if (item.getLabel() != null && this.getSection() != null) {
            item.getLabel().setParentDescriptor(this.getSection());
        }
    }

}
