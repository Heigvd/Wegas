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
 * Define a survey input as a labeled choice. For instance : [ very bad ; bad ;
 * acceptable ; good ; very good ], [true ; false]
 *
 * @author Jarle Hulaas
 */
@Entity
public class SurveyChoicesInstance extends SurveyInputInstance {

    private static final long serialVersionUID = 1L;

    // Default constructor:
    public SurveyChoicesInstance(){
        
    }
   
}
