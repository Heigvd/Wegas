/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence.input;

import ch.albasim.wegas.annotations.CommonView;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.I18nStringView;
import com.wegas.editor.view.NumberView;
import static java.lang.Boolean.FALSE;
import java.util.Collection;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.OneToOne;
import javax.persistence.Table;

/**
 * Define an grade-like evaluation by defined a scale (min and max)
 *
 * @author Jarle Hulaas
 */
@Entity
@Table(
    indexes = {
        @Index(columnList = "unit_id"),}
)
public class SurveyNumberDescriptor extends SurveyInputDescriptor {

    private static final long serialVersionUID = 1L;

    @WegasEntityProperty(view = @View(
        label = "Minimum",
        layout = CommonView.LAYOUT.shortInline,
        value = NumberView.WithNegInfinityPlaceholder.class
    ))
    @Errored(NumberDescriptor.NumberDescBoundsConstraint.class)
    private Long minValue;

    @WegasEntityProperty(view = @View(
        label = "Maximum",
        layout = CommonView.LAYOUT.shortInline,
        value = NumberView.WithNegInfinityPlaceholder.class
    ))
    @Errored(NumberDescriptor.NumberDescBoundsConstraint.class)
    private Long maxValue;

    /**
     * Tells if this input should be presented as a scale
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.False.class,
        view = @View(label = "Present as a scale", value = Hidden.class))
    private Boolean isScale = FALSE;

    /**
     * Optional measurement unit (years, percent, etc.) Player visible
     */
    @OneToOne(cascade = CascadeType.ALL /*, orphanRemoval = true*/)
    @WegasEntityProperty(searchable = true,
        nullable = false, optional = false, proposal = ValueGenerators.EmptyI18n.class,
        view = @View(
            label = "Unit",
            description = "Displayed to players",
            value = I18nStringView.class
        ))
    private TranslatableContent unit;

    // Default constructor
    public SurveyNumberDescriptor() {
        // ensure there is an empty constructor
    }

    /**
     * get the minimum allowed value. NULL means no boundary
     *
     * @return minimum boundary
     */
    public Long getMinValue() {
        return minValue;
    }

    /**
     * Set the minimum allowed value (included)
     *
     * @param minValue
     */
    public void setMinValue(Long minValue) {
        this.minValue = minValue;
    }

    /**
     * get the maximum allowed value. NULL means no boundary
     *
     * @return minimum boundary
     */
    public Long getMaxValue() {
        return maxValue;
    }

    /*
     * Set the maximum allowed value (included)
     * 
     * @param minValue 
     */
    public void setMaxValue(Long maxValue) {
        this.maxValue = maxValue;
    }

    /*
     * Get the isScale value
     * 
     * @param minValue 
     */
    public Boolean getIsScale() {
        return isScale;
    }

    /*
     * Set the isScale parameter
     * 
     * @param minValue 
     */
    public void setIsScale(Boolean isScale) {
        this.isScale = isScale;
    }

    /*
     * Get the measurement unit
     */
    public TranslatableContent getUnit() {
        return unit;
    }

    /* 
     * Set the measurement unit
     */
    public void setUnit(TranslatableContent unit) {
        this.unit = unit;
        if (this.unit != null) {
            this.unit.setParentDescriptor(this);
        }
    }

    @Override
    public WithPermission getMergeableParent() {
        return this.getSection();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        return this.getSection().getRequieredUpdatePermission(context);
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        return this.getSection().getRequieredReadPermission(context);
    }

}
