/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonTypeName;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.editor.JSONSchema.JSONObject;
import com.wegas.editor.Schema;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.View;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.Entity;

/*
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@JsonIgnoreProperties(value = {"content"})
@JsonTypeName("DialogueDescriptor")
@Schema(property = "states", value = DialogueDescriptor.StateProp.class, view = @View(label = "", value = Hidden.class))
public class DialogueDescriptor extends AbstractStateMachineDescriptor<DialogueState, DialogueTransition> {

    private static final long serialVersionUID = 1L;

    public static class StateProp extends JSONObject {

        public StateProp() {
            Map<Long, AbstractState> states = new HashMap<>();
            DialogueState state = new DialogueState();
            state.setVersion(0l);

            state.setText(new TranslatableContent());
            state.getText().setVersion(0l);

            state.setEditorPosition(new Coordinate());
            state.getEditorPosition().setX(100);
            state.getEditorPosition().setY(100);

            state.setOnEnterEvent(new Script());

            states.put(1l, state);
            this.setValue(states);
        }
    }
}
