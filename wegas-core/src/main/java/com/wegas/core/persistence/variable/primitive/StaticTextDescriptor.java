/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.editor.ValueGenerators.EmptyI18n;
import com.wegas.editor.view.I18nHtmlView;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.Index;
import javax.persistence.OneToOne;
import javax.persistence.Table;

/**
 * Static text defines a text at the descriptor level. Its instance does not contains anything
 *
 * @author Maxence
 */
@Entity
@Table(
    indexes = {
        @Index(columnList = "text_id")
    }
)
public class StaticTextDescriptor extends VariableDescriptor<StaticTextInstance> {

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyI18n.class,
        view = @View(label = "Value", value = I18nHtmlView.class))
    private TranslatableContent text;

    /**
     * @return the description
     */
    public TranslatableContent getText() {
        return text;
    }

    /**
     * @param text the text to set
     */
    public void setText(TranslatableContent text) {
        this.text = text;
        if (this.text != null) {
            this.text.setParentDescriptor(this);
        }
    }

    /**
     * Hack to act as TextDescriptor
     * @return the text
     */
    @JsonIgnore
    public String getValue(Player self) {
        return this.getText().translateOrEmpty(self);
    }

    /**
     *
     * @param p
     *
     * @return the text
     */
    @JsonIgnore
    public TranslatableContent getTrValue(Player p) {
        return this.getText();
    }

}
