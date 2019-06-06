/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.wegas.core.persistence.game.GameModel;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.wegas.core.persistence.variable.Beanjection;
import javax.persistence.Entity;

/*
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonIgnoreProperties(value = {"content"})
@JsonTypeName("DialogueDescriptor")
public class DialogueDescriptor extends AbstractStateMachineDescriptor<DialogueState, DialogueTransition> {

    private static final long serialVersionUID = 1L;

    @Override
    public void revive(GameModel gameModel, Beanjection beans) {
        super.revive(gameModel, beans);
        for (DialogueState s : this.getInternalStates()) {
            if (s.getText() != null) {
                s.getText().setParentDescriptor(this);
            }

            for (DialogueTransition t : s.getTransitions()) {
                if (t.getActionText() != null) {
                    t.getActionText().setParentDescriptor(this);
                }
            }
        }
    }
}
