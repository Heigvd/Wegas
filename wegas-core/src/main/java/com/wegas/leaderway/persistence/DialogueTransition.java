/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.statemachine.Transition;
import javax.persistence.Entity;
import javax.persistence.Lob;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
public class DialogueTransition extends Transition {
    @Lob
    private String actionText;

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
    public void merge(AbstractEntity other){
        this.actionText = ((DialogueTransition) other).actionText;
        super.merge(other);
    }
}
