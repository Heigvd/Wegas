/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.annotations.Scriptable;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.editor.View.I18nHtmlView;
import com.wegas.editor.View.View;
import javax.persistence.Entity;
import org.graalvm.polyglot.Value;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
public class TextDescriptor extends VariableDescriptor<TextInstance>
        implements PrimitiveDescriptorI<String> {

    private static final long serialVersionUID = 1L;

    // ~~~ Sugar for scripts ~~~
    /**
     * @param p
     * @param value
     */
    @Override
    public void setValue(Player p, String value) {
        this.getInstance(p).setValue(value, p.getLang());
    }

    /**
     *
     * @param p
     * @param value
     */
    @Scriptable
    public void setValue(
            Player p,
            @Param(view = @View(label = "", value = I18nHtmlView.class)) TranslatableContent value) {
        this.getInstance(p).setValue(value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setValue(Player p, Value value) {
        this.getInstance(p).setValue(value);
    }

    /**
     *
     * @param p
     *
     * @return value of player instance
     */
    @Override
    @Scriptable(label = "value")
    public String getValue(Player p) {
        return this.getInstance(p).getValue();
    }

    /**
     *
     * @param p
     *
     * @return value of player instance
     */
    public TranslatableContent getTrValue(Player p) {
        return this.getInstance(p).getTrValue();
    }
}
