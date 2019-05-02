package com.wegas.editor.JSONSchema;

import java.util.List;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;

@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class JSONType extends JSONExtendedSchema {
    abstract String getType();

    private JsonNode value;

    @JsonProperty("enum")
    private List<JsonNode> enums;

    @JsonProperty("const")
    private JsonNode constant;

    private String description;

    /**
     * @return the description
     */
    public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     * @return the enums (enum)
     */
    public List<JsonNode> getEnums() {
        return enums;
    }

    /**
     * @param enums the enums to set (enum)
     */
    public void setEnums(List<JsonNode> enums) {
        this.enums = enums;
    }

    /**
     * @return the value
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public JsonNode getValue() {
        return value;
    }

    /**
     * @param value the value to set
     */
    public void setValue(JsonNode value) {
        this.value = value;
    }

    /**
     * @return the constant (const)
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public JsonNode getConstant() {
        return constant;
    }

    /**
     * @param constant the constant to set (const)
     */
    public void setConstant(JsonNode constant) {
        this.constant = constant;
    }
}