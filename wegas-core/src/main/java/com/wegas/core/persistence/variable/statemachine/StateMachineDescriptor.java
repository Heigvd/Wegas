/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonTypeName;
import com.wegas.core.persistence.game.Script;
import com.wegas.editor.JSONSchema.JSONObject;
import com.wegas.editor.Schema;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.View;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.*;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
@Entity
@Table(name = "FSMDescriptor")
@JsonTypeName(value = "FSMDescriptor")

@Schema(property = "states", value = StateMachineDescriptor.StateProp.class, view = @View(label = "", value = Hidden.class))
public class StateMachineDescriptor extends AbstractStateMachineDescriptor<State, Transition> {

    public static class StateProp extends JSONObject {

        public StateProp() {
            Map<Long, AbstractState> states = new HashMap<>();
            State state = new State();
            state.setLabel("");
            state.setVersion(0l);
            state.setEditorPosition(new Coordinate());
            state.getEditorPosition().setX(100);
            state.getEditorPosition().setY(100);

            state.setOnEnterEvent(new Script());

            states.put(1l, state);
            this.setValue(states);
        }
    }

}
