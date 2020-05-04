/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import ch.albasim.wegas.annotations.CommonView;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.editor.view.NumberView;
import javax.persistence.Entity;

/**
 * Define an grade-like evaluation by defined a scale (min and max)
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class GradeDescriptor extends EvaluationDescriptor<GradeInstance> {

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

    @Override
    protected GradeInstance newInstance() {
        GradeInstance gi = new GradeInstance();
        /*if (this.getMinValue() != null && this.getMaxValue() != null) {
            gi.setValue(Math.floor((getMinValue() + getMaxValue()) / 2.0));
        } else if (this.getMinValue() != null) {
            gi.setValue(getMinValue().doubleValue());
        } else if (this.getMaxValue() != null) {
            gi.setValue(getMaxValue().doubleValue());
        } else {
            gi.setValue(0.0);
        }*/
        gi.setValue(null);
        return gi;
    }
}
