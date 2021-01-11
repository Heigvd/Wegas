/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.rest;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * Update a translation within a persisted TranslatableContent
 *
 * @author maxence
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class TranslationUpdate extends I18nUpdate {

    /**
     * Id of the TranslatableContent to update
     */
    private Long trId;

    /**
     * Code language to update
     */
    private String code;

    /**
     * New translation to set
     */
    private String value;

    /**
     * @return id of the translatableContent to update
     */
    public Long getTrId() {
        return trId;
    }

    /**
     * @param trId is of the TranslatableContent to update
     */
    public void setTrId(Long trId) {
        this.trId = trId;
    }

    /**
     * @return the code of the language to update
     */
    public String getCode() {
        return code;
    }

    /**
     * @param code the code of the language to update
     */
    @Override
    public void setCode(String code) {
        this.code = code;
    }

    /**
     * @param translation the new value of the translation
     */
    @Override
    public void setValue(String translation) {
        this.value = translation;
    }

    /**
     * @return the new value of the translation
     */
    @Override
    public String getValue() {
        return this.value;
    }
}
