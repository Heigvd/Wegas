 /*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.Entity;

/**
 * define an evaluation as free text
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class TextEvaluationDescriptor extends EvaluationDescriptor<TextEvaluationInstance> {

    private static final long serialVersionUID = 1L;

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof TextEvaluationDescriptor) {
            super.merge(a);
            // Nothing to merge
        }
    }

    @Override
    public TextEvaluationInstance createInstance() {
        TextEvaluationInstance i = new TextEvaluationInstance();
        i.setDescriptor(this);
        return i;
    }
}
