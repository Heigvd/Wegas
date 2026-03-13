package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class Activity implements IStatementObject {
    public static final String ACTIVITY = "Activity";

    private String id;
    private ActivityDefinition definition;

    public Activity() {
    }

    public Activity(String id) {
        this.id = id;
    }

    public Activity(String id, ActivityDefinition definition) {
        this.id = id;
        this.definition = definition;
    }

    public String getObjectType() {
        return ACTIVITY;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public ActivityDefinition getDefinition() {
        return definition;
    }

    public void setDefinition(ActivityDefinition definition) {
        this.definition = definition;
    }

    public JsonElement serialize() {
        return new JsonObject();
    }

    public String toString() {
        return "";
    }

    public String toString(String langMap) {
        return "";
    }
}
