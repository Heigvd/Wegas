 /*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.wegas.core.exception.ConstraintViolationException;
import com.wegas.core.persistence.AbstractEntity;

/**
 *
 * Grade evaluation instance
 * 
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class GradeInstance extends EvaluationInstance {

    /**
     * given grade
     */
    private Double value;

    /**
     * get the given grade or null if not yet given
     * @return 
     */
    public Double getValue() {
        return value;
    }

    /**
     * Set the grade
     * @param value the grade to give
     * @throws ConstraintViolationException when grade is out of bound
     */
    public void setValue(Double value) {
        if (this.getDescriptor() instanceof GradeDescriptor) {             // @fixme (Occurs when numberinstance are used for list descriptors)
            GradeDescriptor desc = (GradeDescriptor) this.getDescriptor();
            if ((desc.getMaxValue() != null && value > desc.getMaxValue())
                    || (desc.getMinValue() != null && value < desc.getMinValue())) {
                throw new ConstraintViolationException(desc.getLabel() + " is out of bound.");
            }
        }

        this.value = value;
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof GradeInstance) {
            GradeInstance o = (GradeInstance) a;
            super.merge(a);
        }
    }
}
