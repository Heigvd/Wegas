/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.wegas.core.exception.client.WegasOutOfBoundException;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.editor.View.View;
import javax.persistence.Column;
import javax.persistence.Entity;

/**
 *
 * Grade evaluation instance
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class GradeInstance extends EvaluationInstance {

    private static final long serialVersionUID = 1L;

    /**
     * given grade
     */
    @Column(name = "evaluationvalue")
    @WegasEntityProperty(view = @View(label = "Value"))
    private Double value;

    /**
     * get the given grade or null if not yet given
     *
     * @return the grade of null if not yet available
     */
    public Double getValue() {
        return value;
    }

    /**
     * Set the grade
     *
     * @param value the grade to give
     *
     * @throws WegasOutOfBoundException when grade is out of bound
     */
    public void setValue(Double value) {
        if (value != null && !Double.isNaN(value) && this.getDescriptor() != null && this.getDescriptor() instanceof GradeDescriptor) {
            GradeDescriptor desc = (GradeDescriptor) this.getDescriptor();
            if ((desc.getMaxValue() != null && value > desc.getMaxValue())
                    || (desc.getMinValue() != null && value < desc.getMinValue())) {
                throw new WegasOutOfBoundException(desc.getMinValue().doubleValue(), desc.getMaxValue().doubleValue(), value, desc.getName(), desc.getName());
            }
        }

        this.value = value;
    }

}
