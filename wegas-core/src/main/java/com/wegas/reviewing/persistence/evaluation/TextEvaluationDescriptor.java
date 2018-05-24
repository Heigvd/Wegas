/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.reviewing.persistence.evaluation;

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
    protected TextEvaluationInstance newInstance() {
        return new TextEvaluationInstance();
    }
}
