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
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.type.TypeFactory;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationContentDeserializer;
import com.wegas.core.persistence.game.GameModelLanguage;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.io.IOException;
import javax.persistence.CascadeType;
import javax.persistence.Index;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.Entity;
import java.util.List;
import org.graalvm.polyglot.Value;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Table(indexes = {
    @Index(columnList = "trvalue_id")
})
@Entity
public class StringInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(StringInstance.class);

    /**
     *
     */
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonDeserialize(using = TranslationContentDeserializer.class)
    @WegasEntityProperty
    private TranslatableContent trValue;

    /**
     * @return the value
     */
    public TranslatableContent getTrValue() {
        return trValue;
    }

    @JsonIgnore
    public String getValue() {
        return this.getTrValue().translateOrEmpty(this.getEffectiveOwner().getAnyLivePlayer());
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

    /**
     * Setter used by graal vm
     *
     * @param value
     */
    public void setValue(Value value) {
        TranslatableContent trc = TranslatableContent.readFromPolyglot(value);
        if (trc != null && this.getTrValue() != null) {
            this.getTrValue().merge(trc);
        }
    }

    /**
     * Value can be a string "as-is", or JSON array of string.
     * <p>
     * If the StringDescriptor defines some allowed values, the as-is value or
     * each string in the array must equal one of the allowed values. Otherwise,
     * a WegasErrorMessage is therown.
     * <p>
     * since no language is given, the first one defined in the game model will be used.
     * This will erase all other translations.
     *
     * @param value the value to set
     */
    @JsonProperty
    public void setValue(String value) {
        // guess lang code
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
     * Value can be a string "as-is", or JSON array of string.
     * <p>
     * If the StringDescriptor defines some allowed values, the as-is value or
     * each string in the array must equal one of the allowed values. Otherwise,
     * a WegasErrorMessage is therown.
     * <p>
     * This will set the value for the given language. All other translations will be erased.
     *
     * @param value    the value to set
     * @param langCode the language of the value
     */
    public void setValue(String value, String langCode) {
        VariableDescriptor vd = this.findDescriptor();
        if (vd instanceof StringDescriptor && value != null) {
            StringDescriptor sd = (StringDescriptor) vd;
            String[] values = this.parseValues(value);
            for (String v : values) {
                if (!sd.isValueAllowed(v)) {
                    throw WegasErrorMessage.error("Value \"" + value + "\" not allowed !");
                }
            }
        }

        this.setTrValue(TranslatableContent.merger(this.getTrValue(), TranslatableContent.build(langCode, value)));
    }

    /**
     * convert the strValue to array
     *
     * @param strValue
     *
     * @return
     */
    public String[] parseValues(String strValue) {
        String[] values;

        try {
            ObjectMapper mapper = new ObjectMapper();
            values = mapper.readValue(strValue, TypeFactory.defaultInstance().constructArrayType(String.class));

        } catch (IOException ex) {
            values = new String[1];
            values[0] = strValue;
        }
        return values;
    }
}
