/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators;
import javax.persistence.Entity;
import javax.persistence.EnumType;
import javax.persistence.Enumerated;

/**
 * Instance of the SurveyDescriptor variable:<br>
 * - keeps the list of questions/replies that are to be replied.
 *
 * @author Jarle Hulaas
 * @see SurveyDescriptor
 */
@Entity
public class SurveyInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;

    public enum SurveyStatus {
        // NB: Changing the syntax of these keywords may invalidate database-persisted surveys.
        NOT_STARTED, REQUESTED, ONGOING, COMPLETED, CLOSED
    }

    @Enumerated(EnumType.STRING)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.SurveyNotStarted.class,
        view = @View(label = "Status"))
    private SurveyStatus status = SurveyStatus.NOT_STARTED;

    @WegasEntityProperty(
        optional = false, nullable = false, proposal = ValueGenerators.True.class,
        view = @View(label = "Active"))
    private Boolean active = true;

    public SurveyInstance() {
        // ensure there is an empty constructor
    }

    /**
     * @return the status
     */
    public SurveyStatus getStatus() {
        return status;
    }

    /**
     * @param status the status to set
     */
    public void setStatus(SurveyStatus status) {
        this.status = status;
    }

    /**
     * @param statusName the string representation of the status to set
     */
    public void setStatusFromString(String statusName) {
        SurveyStatus newState = SurveyStatus.valueOf(statusName);
        this.status = newState;
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

}
