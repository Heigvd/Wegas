 /*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.Basic;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.Lob;

/**
 *
 * Textual evaluation instance
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class TextEvaluationInstance extends EvaluationInstance {

    /**
     * the evaluation itself
     */
    @Lob
    @Basic(fetch = FetchType.LAZY)
    private String value;

    public TextEvaluationInstance() {
        super();
    }

    public TextEvaluationInstance(TextEvaluationDescriptor ed) {
        super(ed);
    }

    /**
     * get the evaluation
     *
     * @return the evaluation
     */
    public String getValue() {
        return value;
    }

    /**
     * set the evaluation
     *
     * @param value the evaluation
     */
    public void setValue(String value) {
        this.value = value;
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof TextEvaluationInstance) {
            TextEvaluationInstance o = (TextEvaluationInstance) a;
            super.merge(a);
            this.setValue(o.getValue());
        }
    }
}
