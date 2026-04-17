package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.HashMap;
import java.util.Map.Entry;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class InteractionComponent {
    private String id;
    private HashMap<String, String> description;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public HashMap<String, String> getDescription() {
        return description;
    }

    public void setDescription(HashMap<String, String> description) {
        this.description = description;
    }

    private JsonElement serializeMap(HashMap<String, String> map) {
        JsonObject obj = new JsonObject();
        for (Entry<String, String> item : map.entrySet()) {
            obj.addProperty(item.getKey(), item.getValue());
        }
        return obj;
    }

    public JsonElement serialize() {
        return new JsonObject();
    }
}