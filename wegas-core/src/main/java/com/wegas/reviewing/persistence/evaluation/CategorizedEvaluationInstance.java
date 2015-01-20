 /*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.wegas.core.persistence.AbstractEntity;

/**
 * Evaluation instance corresponding to CategorizedEvaluationDescriptor
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class CategorizedEvaluationInstance extends EvaluationInstance {

    /**
     * the chosen category (null means un-chosen)
     */
    private String value = null;

    /**
     * get the chosen category
     * @return the chosen category or null is not yet chosen
     */
    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        if (this.getDescriptor() instanceof CategorizedEvaluationDescriptor) {
            CategorizedEvaluationDescriptor descriptor = (CategorizedEvaluationDescriptor) this.getDescriptor();
            if (descriptor.getCategories().contains(value)) {
                this.value = value;
            } else {
                this.value = null;
            }
        } else {
            this.value = null;
        }
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof CategorizedEvaluationInstance) {
            CategorizedEvaluationInstance o = (CategorizedEvaluationInstance) a;
            super.merge(a);
            this.setValue(o.getValue());
        }
    }
}
