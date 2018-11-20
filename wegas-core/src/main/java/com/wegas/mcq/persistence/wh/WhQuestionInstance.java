/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence.wh;

import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.mcq.persistence.QuestionInstanceI;
import static java.lang.Boolean.FALSE;
import javax.persistence.Column;
import javax.persistence.Entity;

/**
 * @author Maxence
 */
@Entity
public class WhQuestionInstance extends VariableInstance implements QuestionInstanceI {

    private static final long serialVersionUID = 1L;
    //private static final Logger logger = LoggerFactory.getLogger(QuestionInstance.class);

    /**
     *
     */
    private Boolean active = true;

    /**
     *
     */
    private Boolean unread = true;
    /**
     * False until the user has clicked on the global question-wide "submit"
     * button.
     */
    @Column(columnDefinition = "boolean default false")
    private Boolean validated = FALSE;

    /**
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof WhQuestionInstance) {
            WhQuestionInstance other = (WhQuestionInstance) a;
            super.merge(a);
            this.setActive(other.getActive());
            this.setUnread(other.isUnread());
            this.setValidated(other.isValidated());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }

    @Override
    public void revive(Beanjection beans) {
        super.revive(beans);
    }

    /**
     * @return the active
     */
    @Override
    public Boolean getActive() {
        return active;
    }

    /**
     * @param active the active to set
     */
    @Override
    public void setActive(Boolean active) {
        this.active = active;
    }

    /**
     * @param validated the validation status to set
     */
    @Override
    public void setValidated(Boolean validated) {
        this.validated = validated;
    }

    /**
     * @return The validation status of the question
     */
    @Override
    public Boolean isValidated() {
        return this.validated;
    }

    @Override
    public Boolean isUnread() {
        return unread;
    }

    @Override
    public void setUnread(Boolean unread) {
        this.unread = unread;
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
