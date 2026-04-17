package com.wegas.log.xapi;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map.Entry;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class ActivityDefinition {
    private String type;
    private String moreInfo;
    private String interactionType;

    private ArrayList<String> correctResponsesPattern;

    private HashMap<String, JsonElement> extensions;
    private HashMap<String, String> name;
    private HashMap<String, String> description;

    private ArrayList<InteractionComponent> choices;
    private ArrayList<InteractionComponent> scale;
    private ArrayList<InteractionComponent> source;
    private ArrayList<InteractionComponent> target;
    private ArrayList<InteractionComponent> steps;

    public ActivityDefinition() {
    }

    public ActivityDefinition(HashMap<String, String> name, HashMap<String, String> description) {
        this.name = name;
        this.description = description;
    }

    private JsonElement serializeMap(HashMap<String, String> map) {
        JsonObject obj = new JsonObject();
        for (Entry<String, String> item : map.entrySet()) {
            obj.addProperty(item.getKey(), item.getValue());
        }
        return obj;
    }

    private JsonElement serializeInteractionComponents(
            ArrayList<InteractionComponent> components) {
        JsonArray array = new JsonArray();
        for (InteractionComponent comp : components) {
            array.add(comp.serialize());
        }
        return array;
    }

    public JsonElement serialize() {
        return new JsonObject();
    }

    public HashMap<String, String> getName() {
        return name;
    }

    public void setName(HashMap<String, String> name) {
        this.name = name;
    }

    public HashMap<String, String> getDescription() {
        return description;
    }

    public void setDescription(HashMap<String, String> description) {
        this.description = description;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getMoreInfo() {
        return moreInfo;
    }

    public void setMoreInfo(String moreinfo) {
        this.moreInfo = moreinfo;
    }

    public HashMap<String, JsonElement> getExtensions() {
        return extensions;
    }

    public void setExtensions(HashMap<String, JsonElement> extensions) {
        this.extensions = extensions;
    }

    public String getInteractionType() {
        return interactionType;
    }

    public void setInteractionType(String interactionType) {
        this.interactionType = interactionType;
    }

    public ArrayList<String> getCorrectResponsesPattern() {
        return correctResponsesPattern;
    }

    public void setCorrectResponsesPattern(
            ArrayList<String> correctResponsesPattern) {
        this.correctResponsesPattern = correctResponsesPattern;
    }

    public ArrayList<InteractionComponent> getChoices() {
        return choices;
    }

    public void setChoices(ArrayList<InteractionComponent> choices) {
        this.choices = choices;
    }

    public ArrayList<InteractionComponent> getScale() {
        return scale;
    }

    public void setScale(ArrayList<InteractionComponent> scale) {
        this.scale = scale;
    }

    public ArrayList<InteractionComponent> getSource() {
        return source;
    }

    public void setSource(ArrayList<InteractionComponent> source) {
        this.source = source;
    }

    public ArrayList<InteractionComponent> getTarget() {
        return target;
    }

    public void setTarget(ArrayList<InteractionComponent> target) {
        this.target = target;
    }

    public ArrayList<InteractionComponent> getSteps() {
        return steps;
    }

    public void setSteps(ArrayList<InteractionComponent> steps) {
        this.steps = steps;
    }

    public String toString() {
        return "";
    }

    public String toString(String langMap) {
        return "";
    }
}
