package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.HashMap;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class Verb {
    private String id;
    private HashMap<String, String> display;

    public Verb() {
    }

    public Verb(String id) {
        this.id = id;
    }

    public Verb(String id, HashMap<String, String> display) {
        this.id = id;
        this.display = display;
    }

    public JsonElement serialize() {
        return new JsonObject();
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public HashMap<String, String> getDisplay() {
        return display;
    }

    public void setDisplay(HashMap<String, String> display) {
        this.display = display;
    }

    public String toString() {
        return "";
    }

    public String toString(String langKey) {
        return "";
    }
}
