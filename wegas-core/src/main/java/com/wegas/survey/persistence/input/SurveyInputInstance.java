/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence.input;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.view.Hidden;
import static java.lang.Boolean.FALSE;
import jakarta.persistence.Entity;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;

/**
 *
 * A survey input instance just stores the status replied/unreplied of the corresponding
 * question/input descriptor.
 *
 * @author Jarle Hulaas
 */
@Entity
@Inheritance(strategy = InheritanceType.JOINED)
public class SurveyInputInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;

    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.True.class,
        view = @View(label = "Active"))
    private Boolean active = true;

    /**
     * False until the user has replied at least once to this question/input.
     */
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.False.class,
        view = @View(label = "isReplied", value = Hidden.class))
    private Boolean isReplied = FALSE;

    /**
     * Basic constructor
     */
    public SurveyInputInstance() {
        // ensure there is an empty constructor
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
