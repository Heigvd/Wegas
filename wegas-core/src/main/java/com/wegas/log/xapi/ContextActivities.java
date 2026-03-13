package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.ArrayList;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class ContextActivities {
    private ArrayList<Activity> parent;
    private ArrayList<Activity> grouping;
    private ArrayList<Activity> category;
    private ArrayList<Activity> other;

    public ArrayList<Activity> getParent() {
        return parent;
    }

    public void setParent(ArrayList<Activity> parent) {
        this.parent = parent;
    }

    public ArrayList<Activity> getGrouping() {
        return grouping;
    }

    public void setGrouping(ArrayList<Activity> grouping) {
        this.grouping = grouping;
    }

    public ArrayList<Activity> getCategory() {
        return category;
    }

    public void setCategory(ArrayList<Activity> category) {
        this.category = category;
    }

    public ArrayList<Activity> getOther() {
        return other;
    }

    public void setOther(ArrayList<Activity> other) {
        this.other = other;
    }

    public JsonElement serialize() {
        return new JsonObject();
    }
}
