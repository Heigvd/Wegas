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
 * Define a scale as survey input (min and max)
 *
 * @author Jarle Hulaas
 */
@Entity
public class SurveyNumberInstance extends SurveyInputInstance {

    private static final long serialVersionUID = 1L;


    // Default constructor
    public SurveyNumberInstance() {
        
    }
    
}
