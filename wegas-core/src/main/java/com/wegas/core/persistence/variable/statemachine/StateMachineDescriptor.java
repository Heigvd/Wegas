/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import ch.albasim.wegas.annotations.View;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.wegas.core.persistence.game.Script;
import com.wegas.editor.Schema;
import com.wegas.editor.jsonschema.JSONObject;
import com.wegas.editor.view.Hidden;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.Entity;
import javax.persistence.Table;

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

            state.setX(100);
            state.setY(100);

            state.setOnEnterEvent(new Script());

            states.put(1l, state);
            this.setValue(states);
        }
    }

}
