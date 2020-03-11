/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.survey.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators;
import com.wegas.editor.View.Hidden;
import static java.lang.Boolean.FALSE;
import javax.persistence.Column;
import javax.persistence.Entity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

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
    private static final Logger logger = LoggerFactory.getLogger(SurveyInstance.class);

    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ValueGenerators.True.class,
            view = @View(label = "Active"))
    private Boolean active = true;

    /**
     * Becomes true when the survey is requested by the trainer.
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ValueGenerators.False.class,
            view = @View(label = "Requested", value = Hidden.class))
    private Boolean requested = FALSE;

    /**
     * Becomes true when the survey is initiated/displayed.
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ValueGenerators.False.class,
            view = @View(label = "Started", value = Hidden.class))
    private Boolean started = FALSE;

    /**
     * False until the user has clicked on the global survey-wide "submit" button.
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ValueGenerators.False.class,
            view = @View(label = "Validated", value = Hidden.class))
    private Boolean validated = FALSE;

    /**
     * Becomes true when the user has clicked on the final "close" button.
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = ValueGenerators.False.class,
            view = @View(label = "Validated", value = Hidden.class))
    private Boolean closed = FALSE;

    
    public SurveyInstance() {

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

    /**
     * @return the requested
     */
    public Boolean getRequested() {
        return requested;
    }

    /**
     * @param requested the requested to set.
     */
    public void setRequested(Boolean requested) {
        this.requested = requested;
    }

    /**
     * @return the started
     */
    public Boolean getStarted() {
        return started;
    }

    /**
     * @param started the started to set.
     */
    public void setStarted(Boolean started) {
        this.started = started;
    }


    /**
     * @return the validated
     */
    public Boolean getValidated() {
        return validated;
    }

    /**
     * @param validated the validated to set.
     */
    public void setValidated(Boolean validated) {
        this.validated = validated;
    }

    /**
     * @return the closed
     */
    public Boolean getClosed() {
        return closed;
    }

    /**
     * @param closed the closed to set.
     */
    public void setClosed(Boolean closed) {
        this.closed = closed;
    }

}
