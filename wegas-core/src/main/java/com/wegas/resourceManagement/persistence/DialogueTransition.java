/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.rest.util.Views;
import javax.persistence.Entity;
import javax.persistence.Lob;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class DialogueTransition extends Transition {

    @Lob
    private String actionText;

    @JsonView(Views.EditorExtendedI.class)
    private Integer index = 0;

    /**
     * @return the actionText
     */
    public String getActionText() {
        return actionText;
    }

    /**
     * @param actionText the actionText to set
     */
    public void setActionText(String actionText) {
        this.actionText = actionText;
    }

    @Override
    public void merge(AbstractEntity other) {
        DialogueTransition otherDialogue = (DialogueTransition) other;
        this.actionText = otherDialogue.actionText;
        this.index = otherDialogue.index;
        super.merge(other);
    }

    /**
     * @return the index
     */
    public Integer getIndex() {
        return index;
    }

    /**
     * @param index the index to set
     */
    public void setIndex(Integer index) {
        this.index = index;
    }
}
