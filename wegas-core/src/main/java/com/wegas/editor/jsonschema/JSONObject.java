package com.wegas.editor.jsonschema;

import ch.albasim.wegas.annotations.JSONSchema;
import java.util.HashMap;
import java.util.Map;

public class JSONObject extends JSONType {

    private Map<String, JSONSchema> properties;
    private JSONSchema additionalProperties;

    public JSONObject() {
        this(false);
    }

    public JSONObject(boolean nullable) {
        super(nullable);
    }

    /**
     * @return the additionalProperties
     */
    public JSONSchema getAdditionalProperties() {
        return additionalProperties;
    }

    /**
     * @param additionalProperties the additionalProperties to set
     */
    public void setAdditionalProperties(JSONSchema additionalProperties) {
        this.additionalProperties = additionalProperties;
    }

    /**
     * @return the properties
     */
    public Map<String, JSONSchema> getProperties() {
        return properties;
    }

    /**
     * @param prop  the property name
     * @param value the value
     */
    public void setProperty(String prop, JSONSchema value) {
        if (this.properties == null) {
            this.properties = new HashMap<>();
        }
        this.properties.put(prop, value);
    }

    @Override
    final public String getType() {
        return "object";
    }

}
