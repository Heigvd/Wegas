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
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.reviewing.persistence.evaluation.EvaluationInstance;
import static java.lang.Boolean.FALSE;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.OneToMany;

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
    private Boolean active = true;
    /**
     * False until the user has clicked on the global question-wide "submit"
     * button.
     */
    @Column(columnDefinition = "boolean default false")
    private Boolean validated = FALSE;


    @OneToMany(mappedBy = "whQuestion", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<EvaluationInstance> answers = new ArrayList<>();

    /**
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof WhQuestionInstance) {
            WhQuestionInstance other = (WhQuestionInstance) a;
            super.merge(a);
            this.setActive(other.getActive());
            this.setValidated(other.isValidated());
            this.setAnswers(ListUtils.mergeLists(this.getAnswers(), other.getAnswers()));
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
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

    public List<EvaluationInstance> getAnswers() {
        return answers;
    }

    public void setAnswers(List<EvaluationInstance> answers) {
        this.answers = answers;
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
