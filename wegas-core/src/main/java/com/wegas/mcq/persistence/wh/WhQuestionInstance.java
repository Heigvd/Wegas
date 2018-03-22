/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence.wh;

import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableInstance;
import static java.lang.Boolean.FALSE;
import javax.persistence.Column;
import javax.persistence.Entity;

/**
 * @author Maxence
 */
@Entity
public class WhQuestionInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    //private static final Logger logger = LoggerFactory.getLogger(QuestionInstance.class);

    /**
     *
     */
    @WegasEntityProperty
    private Boolean active = true;
    /**
     * False until the user has clicked on the global question-wide "submit"
     * button.
     */
    @Column(columnDefinition = "boolean default false")
    @WegasEntityProperty
    private Boolean validated = FALSE;

    /**
     * @param a
     */
    @Override
    public void revive(Beanjection beans) {
        super.revive(beans);
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
     * @param validated the validation status to set
     */
    public void setValidated(Boolean validated) {
        this.validated = validated;
    }

    /**
     * @return The validation status of the question
     */
    public Boolean isValidated() {
        return this.validated;
    }

    // ~~~ Sugar ~~~
    /**
     *
     */
    public void activate() {
        this.setActive(true);
    }

    /**
     *
     */
    public void desactivate() {
        this.deactivate();
    }

    /**
     *
     */
    public void deactivate() {
        this.setActive(false);
    }

}
