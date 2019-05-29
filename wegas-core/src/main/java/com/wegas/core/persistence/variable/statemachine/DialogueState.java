/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationContentDeserializer;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToOne;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class DialogueState extends AbstractState<DialogueTransition> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @JsonDeserialize(using = TranslationContentDeserializer.class)
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty
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
