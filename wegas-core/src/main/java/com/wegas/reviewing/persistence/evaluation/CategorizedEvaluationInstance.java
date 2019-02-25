/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.primitive.EnumItem;
import javax.persistence.Column;
import javax.persistence.Entity;

/**
 * Evaluation instance corresponding to CategorizedEvaluationDescriptor
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class CategorizedEvaluationInstance extends EvaluationInstance {

    private static final long serialVersionUID = 1L;

    /**
     * the chosen category (null means un-chosen)
     */
    @Column(name = "evaluationvalue")
    @WegasEntityProperty
    private String value;

    /**
     * get the chosen category
     *
     * @return the chosen category or null is not yet chosen
     */
    public String getValue() {
        return value;
    }

    /**
     * Set the category
     *
     * @param categoryName name of the category to set. If category does not match any
     *                     category from the descriptor, category is set as NULL.
     */
    public void setValue(String categoryName) {
        if (this.getDescriptor() instanceof CategorizedEvaluationDescriptor) {
            CategorizedEvaluationDescriptor descriptor = (CategorizedEvaluationDescriptor) this.getDescriptor();
            EnumItem category = descriptor.findItem(categoryName);
            this.value = (category != null ? category.getName() : null);
        } else {
            this.value = null;
        }
    }

}
