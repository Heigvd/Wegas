/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationContentDeserializer;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.utils.StringInstanceCustomizer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.Entity;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Index;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import jdk.nashorn.api.scripting.JSObject;
import org.eclipse.persistence.annotations.Customizer;

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

    private static final Logger logger = LoggerFactory.getLogger(TextInstance.class);

    /**
     *
     */
    @JsonDeserialize(using = TranslationContentDeserializer.class)
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty
    private TranslatableContent trValue;

    /**
     *
     */
    public TextInstance() {
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
     * Setter used by nashorn
     *
     * @param value
     */
    public void setValue(JSObject value) {
        TranslatableContent readFromNashorn = TranslatableContent.readFromNashorn(value);
        if (readFromNashorn != null && this.getTrValue() != null) {
            this.getTrValue().merge(readFromNashorn);
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
        VariableDescriptor desc = this.findDescriptor();
        this.setTrValue(TranslatableContent.merger(this.getTrValue(), TranslatableContent.build(lang, value)));
    }
}
