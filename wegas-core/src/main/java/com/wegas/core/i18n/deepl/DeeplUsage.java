/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.deepl;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 *
 * DeepL usage response.
 * <p>
 * api.deepl.com/v1/usage response.
 *
 *
 * @author maxence
 */
    public class DeeplUsage {

    @JsonProperty("character_count")
    private Long characterCount;

    @JsonProperty("character_limit")
    private Long characterLimit;

    public Long getCharacterCount() {
        return characterCount;
    }

    public void setCharacterCount(Long characterCount) {
        this.characterCount = characterCount;
    }

    public Long getCharacterLimit() {
        return characterLimit;
    }

    public void setCharacterLimit(Long characterLimit) {
        this.characterLimit = characterLimit;
    }

    @JsonIgnore
    public Double getRatio() {
        return characterCount.doubleValue() / characterLimit.doubleValue();
    }
}
