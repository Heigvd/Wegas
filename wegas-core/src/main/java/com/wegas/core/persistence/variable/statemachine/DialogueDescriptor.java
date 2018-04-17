/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.wegas.core.persistence.variable.Beanjection;
import javax.persistence.Entity;

/*
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonIgnoreProperties(value = {"content"})
public class DialogueDescriptor extends StateMachineDescriptor {

    private static final long serialVersionUID = 1L;

    @Override
    public void revive(Beanjection beans) {
        super.revive(beans);
        for (State s : this.getStates().values()) {
            if (s instanceof DialogueState) {
                DialogueState ds = (DialogueState) s;
                ds.getText().setParentDescriptor(this);
            }

            for (Transition t : s.getTransitions()) {
                if (t instanceof DialogueTransition) {
                    DialogueTransition dt = (DialogueTransition) t;
                    dt.getActionText().setParentDescriptor(this);
                }
            }
        }
    }
}
