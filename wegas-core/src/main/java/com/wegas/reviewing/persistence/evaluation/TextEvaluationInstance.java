/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import javax.persistence.Basic;
import javax.persistence.Column;
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

    private static final long serialVersionUID = 1L;

    /**
     * the evaluation itself
     */
    @Lob
    @Basic(fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    @Column(name = "evaluationvalue")
    @WegasEntityProperty(view = @View(label = "Value"))
    private String value;

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

}
