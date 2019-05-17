/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.editor.JSONSchema.JSONObject;
import com.wegas.editor.Schema;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.I18nHtmlView;
import com.wegas.editor.View.View;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToOne;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Schema(property = "label", value = JSONObject.class, view = @View(label = "", value = Hidden.class))
public class DialogueState extends State {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(view = @View(label = "Text", value = I18nHtmlView.class))
    private TranslatableContent text;

    @Override
    public void setStateMachine(StateMachineDescriptor stateMachine) {
        super.setStateMachine(stateMachine);
        if (this.getStateMachine() != null) {
            this.setText(this.text);

            for (Transition t : this.getTransitions()) {
                if (t instanceof DialogueTransition) {
                    DialogueTransition dt = (DialogueTransition) t;
                    dt.setActionText(dt.getActionText());
                }
            }
        }
    }

    public TranslatableContent getText() {
        return text;
    }

    public void setText(TranslatableContent text) {
        this.text = text;
        if (this.text != null) {
            this.text.setParentDescriptor(this.getStateMachine());
        }
    }
}
