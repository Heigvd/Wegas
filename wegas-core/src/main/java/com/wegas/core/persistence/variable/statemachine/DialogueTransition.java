/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.statemachine;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.Helper;
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
public class DialogueTransition extends Transition {

    private static final long serialVersionUID = 1L;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonDeserialize(using = TranslationDeserializer.class)
    private TranslatableContent actionText;

    @Override
    public Boolean containsAll(List<String> criterias) {
        return Helper.insensitiveContainsAll(getActionText(), criterias)
                || super.containsAll(criterias);
    }

    /**
     * @return the actionText
     */
    public TranslatableContent getActionText() {
        return actionText;
    }

    /**
     * @param actionText the actionText to set
     */
    public void setActionText(TranslatableContent actionText) {
        this.actionText = actionText;
        if (this.actionText != null && this.getState() != null) {
            this.actionText.setParentDescriptor(getState().getStateMachine());
        }
    }

    @Override
    public void merge(AbstractEntity o) {
        if (o instanceof DialogueTransition) {
            DialogueTransition other = (DialogueTransition) o;
            this.setActionText(TranslatableContent.merger(this.getActionText(), ((DialogueTransition) other).getActionText()));
            super.merge(other);
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + o.getClass().getSimpleName() + ") is not possible");
        }
    }
}
