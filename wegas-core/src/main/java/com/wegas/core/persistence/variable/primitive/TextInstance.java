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
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationDeserializer;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.persistence.variable.VariableInstance;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.Entity;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Index;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import jdk.nashorn.api.scripting.JSObject;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Table(indexes = {
    @Index(columnList = "trvalue_id")
})
@Entity
public class TextInstance extends VariableInstance implements Searchable {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(TextInstance.class);

    /**
     *
     */
    @JsonDeserialize(using = TranslationDeserializer.class)
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
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
        this.setTrValue(TranslatableContent.merger(this.getTrValue(), TranslatableContent.build("def", value)));
    }

    /**
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a != null) {
            if (a instanceof TextInstance) {
                TextInstance vi = (TextInstance) a;
                super.merge(a);
                this.setTrValue(TranslatableContent.merger(this.getTrValue(), vi.getTrValue()));
            } else {
                throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
            }
        }
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        return this.getTrValue().containsAll(criterias);
    }
}
