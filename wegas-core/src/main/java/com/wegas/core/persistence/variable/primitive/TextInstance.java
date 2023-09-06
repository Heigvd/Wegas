/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.CommonView.LAYOUT;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.utils.StringInstanceCustomizer;
import com.wegas.editor.view.I18nHtmlView;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import org.eclipse.persistence.annotations.Customizer;
import org.graalvm.polyglot.Value;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Table(indexes = {
    @Index(columnList = "trvalue_id")
})
@Entity
@Customizer(StringInstanceCustomizer.class)
public class TextInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;

    //private static final Logger logger = LoggerFactory.getLogger(TextInstance.class);

    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(view = @View(label = "Value", value = I18nHtmlView.class, layout=LAYOUT.fullWidth))
    private TranslatableContent trValue;

    /**
     *
     */
    public TextInstance() {
        // ensure to have an empty constructor
    }

    /**
     * @return the value
     */
    public TranslatableContent getTrValue() {
        return trValue;
    }

    /**
     * @param value the value to set
     */
    public void setTrValue(TranslatableContent value) {
        this.trValue = value;
        if (this.trValue != null) {
            this.trValue.setParentInstance(this);
        }
    }

    public void setValue(TranslatableContent trValue) {
        this.setTrValue(trValue);
    }

    @JsonIgnore
    public String getValue() {
        return this.getTrValue().translateOrEmpty(this.getEffectiveOwner().getAnyLivePlayer());
    }

    /**
     * Setter used by graalVM
     *
     * @param value
     */
    public void setValue(Value value) {
        TranslatableContent read = TranslatableContent.readFromNashorn(value);
        if (read != null && this.getTrValue() != null) {
            this.getTrValue().merge(read);
        }
    }

    /**
     * Backward compat used during json deserialisation
     *
     * @param value
     */
    @JsonProperty
    public void setValue(String value) {
        VariableDescriptor desc = this.findDescriptor();
        String lang = "en";
        if (desc != null && desc.getGameModel() != null) {
            List<GameModelLanguage> languages = desc.getGameModel().getRawLanguages();
            if (languages != null && !languages.isEmpty()) {
                lang = languages.get(0).getCode();
            }
        }

        this.setValue(value, lang);
    }

    /**
     * Used for player input.
     * <p>
     * Set the lang translation to value. erase all others
     *
     * @param value the value
     * @param lang  the language
     */
    @JsonProperty
    public void setValue(String value, String lang) {
        this.setTrValue(TranslatableContent.merger(this.getTrValue(), TranslatableContent.build(lang, value)));
    }
}
