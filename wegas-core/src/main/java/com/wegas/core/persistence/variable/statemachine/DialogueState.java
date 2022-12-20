/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.view.I18nHtmlView;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
//@Schema(property = "label", value = JSONObject.class, view = @View(label = "", value = Hidden.class))
public class DialogueState extends AbstractState<DialogueTransition> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional = false, nullable =false, proposal =EmptyI18n.class,
            view = @View(label = "Text", value = I18nHtmlView.class, index = 500))
    private TranslatableContent text;

    @Override
    public void setStateMachine(AbstractStateMachineDescriptor stateMachine) {
        super.setStateMachine(stateMachine);
        if (this.getStateMachine() != null) {
            this.setText(this.text);
            for (DialogueTransition t : this.getTransitions()) {
                t.setActionText(t.getActionText());
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
