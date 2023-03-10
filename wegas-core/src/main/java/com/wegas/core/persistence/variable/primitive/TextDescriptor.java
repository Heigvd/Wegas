/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.CommonView.LAYOUT;
import ch.albasim.wegas.annotations.DependencyScope;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.Translation;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.editor.view.I18nHtmlView;
import java.util.Objects;
import javax.persistence.Entity;
import jdk.nashorn.api.scripting.JSObject;

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
    @Scriptable(dependsOn = DependencyScope.NONE)
    public void setValue(
        Player p,
        @Param(view = @View(label = "", value = I18nHtmlView.class, layout = LAYOUT.fullWidth)) TranslatableContent value) {
        this.getInstance(p).setValue(value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setValue(Player p, JSObject value) {
        this.getInstance(p).setValue(value);
    }

    @Scriptable(dependsOn = DependencyScope.NONE)
    public void setValueIfChanged(
        Player p,
        @Param(view = @View(label = "", value = I18nHtmlView.class, layout = LAYOUT.fullWidth)) TranslatableContent newValue) {

        TranslatableContent defaultValue = this.getDefaultInstance().getTrValue();
        TranslatableContent currentValue = this.getInstance(p).getTrValue();

        for (Translation translation : newValue.getRawTranslations()) {
            String lang = translation.getLang();
            String newT = translation.getTranslation();

            Translation defaultT = defaultValue.getTranslation(lang);
            String dts = "";

            if (defaultT != null) {
                dts = defaultT.getTranslation();
            }

            Translation currentT = currentValue.getTranslation(lang);
            String cts = "";
            if (currentT != null){
                cts = currentT.getTranslation();
            }
            if (!Objects.equals(dts, cts)){
                currentValue.updateTranslation(lang, newT);
            }
        }
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setValueIfChanged(Player p, JSObject value) {
        TranslatableContent newValue = TranslatableContent.readFromNashorn(value);
        this.setValueIfChanged(p, newValue);
    }

    /**
     *
     * @param p
     *
     * @return value of player instance
     */
    @Override
    @Scriptable(label = "value", dependsOn = DependencyScope.SELF)
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
