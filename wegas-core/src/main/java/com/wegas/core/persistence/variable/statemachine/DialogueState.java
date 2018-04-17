/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationDeserializer;
import com.wegas.core.persistence.AbstractEntity;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToOne;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class DialogueState extends State {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL)
    @JsonDeserialize(using = TranslationDeserializer.class)
    private TranslatableContent text;

    @Override
    public Boolean containsAll(final List<String> criterias) {
        return this.getText().containsAll(criterias)
                || super.containsAll(criterias);
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

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof DialogueState) {
            this.setText(TranslatableContent.merger(this.getText(), ((DialogueState) other).getText()));
            super.merge(other);
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + other.getClass().getSimpleName() + ") is not possible");
        }
    }
}
