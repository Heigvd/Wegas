/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence.input;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.View.Hidden;
import static java.lang.Boolean.FALSE;
import javax.persistence.*;

/**
 *
 * A survey input instance just stores the status replied/unreplied of 
 * the corresponding question/input descriptor.
 *
 * @author Jarle Hulaas
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public class SurveyInputInstance
        extends VariableInstance /* AbstractEntity */ {

    private static final long serialVersionUID = 1L;
    
    
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ValueGenerators.True.class,
            view = @View(label = "Active"))
    private Boolean active = true;

    
    /**
     * False until the user has replied at least once to this question/input.
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ValueGenerators.False.class,
            view = @View(label = "isReplied", value = Hidden.class))
    private Boolean isReplied = FALSE;


    /**
     * Basic constructor
     */
    public SurveyInputInstance() {

    }

    /**
     * @return the active
     */
    public Boolean getActive() {
        return active;
    }

    /**
     * @param active the active to set
     */
    public void setActive(Boolean active) {
        this.active = active;
    }
    
    public Boolean getIsReplied() {
        return isReplied;
    }
    
    public void setIsReplied(Boolean b) {
        isReplied = b;
    }
    
       
}
