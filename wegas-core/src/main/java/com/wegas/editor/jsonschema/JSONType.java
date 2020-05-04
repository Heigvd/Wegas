package com.wegas.editor.jsonschema;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public abstract class JSONType extends JSONExtendedSchema {

    private final boolean nullable;

    @JsonIgnore
    abstract String getType();

    @JsonProperty("type")
    public Object getEffectiveTypes() {

        if (this.nullable) {
            List<String> types = new ArrayList<>();
            types.add(this.getType());
            types.add("null");
            return types;
        }

        return this.getType();
    }

    private Object value;

    @JsonProperty("enum")
    private List<String> enums;

    @JsonProperty("const")
    private Object constant;

    private String description;

    protected JSONType(boolean nullable) {
        this.nullable = nullable;
    }

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
    public List<String> getEnums() {
        return enums;
    }

    /**
     * @param enums the enums to set (enum)
     */
    public void setEnums(List<String> enums) {
        this.enums = enums;
    }

    /**
     * @return the value
     */
    public Object getValue() {
        return value;
    }

    /**
     * @param value the value to set
     */
    public void setValue(Object value) {
        this.value = value;
    }

    /**
     * @return the constant (const)
     */
    @JsonInclude(JsonInclude.Include.NON_NULL)
    public Object getConstant() {
        return constant;
    }

    /**
     * @param constant the constant to set (const)
     */
    public void setConstant(Object constant) {
        this.constant = constant;
    }
}
