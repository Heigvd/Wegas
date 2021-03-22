/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import ch.albasim.wegas.annotations.View;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.rest.util.Views;
import com.wegas.editor.jsonschema.JSONObject;
import com.wegas.editor.Schema;
import com.wegas.editor.view.Hidden;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.Entity;

/*
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonIgnoreProperties(value = {"content"})
@Schema(property = "states", value = DialogueDescriptor.StateProp.class, view = @View(label = "", value = Hidden.class))
public class DialogueDescriptor extends AbstractStateMachineDescriptor<DialogueState, DialogueTransition> {

    private static final long serialVersionUID = 1L;

    @Override
    @JsonView(Views.PublicI.class)
    public Map<Long, DialogueState> getStates() {
        return super.getStates();
    }

    public static class StateProp extends JSONObject {

        public StateProp() {
            Map<Long, AbstractState> states = new HashMap<>();
            DialogueState state = new DialogueState();
            state.setVersion(0l);

            state.setText(new TranslatableContent());
            state.getText().setVersion(0l);

            state.setX(100);
            state.setY(100);

            state.setOnEnterEvent(new Script());

            states.put(1l, state);
            this.setValue(states);
        }
    }
}
