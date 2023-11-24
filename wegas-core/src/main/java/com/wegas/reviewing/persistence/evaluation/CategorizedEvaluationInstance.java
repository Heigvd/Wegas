/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.primitive.EnumItem;
import com.wegas.editor.ValueGenerators.EmptyString;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;

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
    @WegasEntityProperty(
            optional = false, nullable= false, proposal = EmptyString.class,
            view = @View(label = "Value"))
    private String value = "";

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
     * @param categoryName name of the category to set. If category does not match any category from
     *                     the descriptor, category is set as NULL.
     */
    public void setValue(String categoryName) {
        EvaluationDescriptor descriptor = this.getDescriptor();
        if (descriptor != null) {
            if (descriptor instanceof CategorizedEvaluationDescriptor) {
                CategorizedEvaluationDescriptor catDescriptor = (CategorizedEvaluationDescriptor) this.getDescriptor();
                EnumItem category = catDescriptor.findItem(categoryName);
                this.value = (category != null ? category.getName() : null);
            } else {
                this.value = null;
            }
        } else {
            // description not available yet, use category name as-is
            this.value = categoryName;
        }
    }
}
