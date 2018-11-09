/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.rest;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 *
 * @author maxence
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonSubTypes(value = {
    @JsonSubTypes.Type(name = "TranslationUpdate", value = TranslationUpdate.class),
    @JsonSubTypes.Type(name = "ScriptUpdate", value = ScriptUpdate.class),
    @JsonSubTypes.Type(name = "InScriptUpdate", value = InScriptUpdate.class)
})
public abstract class I18nUpdate {
}
