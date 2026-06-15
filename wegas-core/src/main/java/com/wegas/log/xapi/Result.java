package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class Result {
    private Score score;
    private Boolean success;
    private Boolean completion;
    private String response;
    private String duration;
    private JsonObject extensions;

    public Score getScore() {
        return score;
    }

    public void setScore(Score score) {
        this.score = score;
    }

    public Boolean isSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public Boolean isCompletion() {
        return completion;
    }

    public void setCompletion(Boolean completion) {
        this.completion = completion;
    }

    public String getResponse() {
        return response;
    }

    public void setResponse(String response) {
        this.response = response;
    }

    public String getDuration() {
        return duration;
    }

    public void setDuration(String duration) {
        this.duration = duration;
    }

    public JsonObject getExtensions() {
        return extensions;
    }

    public void setExtensions(JsonObject extensions) {
        this.extensions = extensions;
    }

    public JsonElement serialize() {
        return new JsonObject();
    }
}
