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
 * define a survey input as free text
 *
 */
@Entity
public class SurveyTextInstance extends SurveyInputInstance {

    private static final long serialVersionUID = 1L;

    // Default constructor:
    public SurveyTextInstance() {

    }
}
