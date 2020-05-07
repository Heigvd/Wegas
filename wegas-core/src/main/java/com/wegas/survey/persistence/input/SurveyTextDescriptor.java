/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence.input;

import javax.persistence.Entity;

/**
 * define an evaluation as free text
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class SurveyTextDescriptor extends SurveyInputDescriptor {

    private static final long serialVersionUID = 1L;

    public SurveyTextDescriptor() {
        // ensure there is an empty constructor
    }
}
