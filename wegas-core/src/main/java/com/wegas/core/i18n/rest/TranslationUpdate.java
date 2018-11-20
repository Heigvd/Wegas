/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.rest;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 *
 * @author maxence
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class TranslationUpdate extends  I18nUpdate {

    private Long trId;
    private String code;
    private String value;

    public Long getTrId() {
        return trId;
    }

    public void setTrId(Long trId) {
        this.trId = trId;
    }

    public String getCode() {
        return code;
    }

    @Override
    public void setCode(String code) {
        this.code = code;
    }

    @Override
    public void setValue(String translation) {
        this.value = translation;
    }

    @Override
    public String getValue(){
        return this.value;
    }
}
