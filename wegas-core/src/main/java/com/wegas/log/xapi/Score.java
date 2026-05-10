package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class Score {
    private float scaled;
    private float raw;
    private float min;
    private float max;

    public float getScaled() {
        return scaled;
    }

    public void setScaled(float scaled) {
        this.scaled = scaled;
    }

    public float getRaw() {
        return raw;
    }

    public void setRaw(float raw) {
        this.raw = raw;
    }

    public float getMin() {
        return min;
    }

    public void setMin(float min) {
        this.min = min;
    }

    public float getMax() {
        return max;
    }

    public void setMax(float max) {
        this.max = max;
    }

    public JsonElement serialize() {
        return new JsonObject();
    }

}
