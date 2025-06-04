/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.deepl;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.Date;

/**
 *
 * DeepL usage response.
 * <p>
 * api.deepl.com/v1/usage response.
 *
 *
 * @author maxence
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class DeeplUsage {

    @JsonProperty("character_count")
    private Long characterCount;

    @JsonProperty("character_limit")
    private Long characterLimit;

    @JsonProperty("start_time")
    private Date startTime;

    @JsonProperty("end_time")
    private Date endTime;

    @JsonProperty("@class")
    public String getJSONClassName() {
        return this.getClass().getSimpleName();
    }

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

    public Date getStartTime() {
        return startTime;
    }

    public void setStartTime(Date startTime) {
        this.startTime = startTime;
    }

    public Date getEndTime() {
        return endTime;
    }

    public void setEndTime(Date endTime) {
        this.endTime = endTime;
    }

    @JsonIgnore
    public Double getRatio() {
        return characterCount.doubleValue() / characterLimit.doubleValue();
    }
}
