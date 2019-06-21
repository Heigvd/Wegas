package com.wegas.editor.JSONSchema;

import com.fasterxml.jackson.annotation.JsonProperty;

public class JSONRef implements JSONSchema {
    @JsonProperty("$ref")
    private String ref;

    public JSONRef(String ref) {
        this.ref = ref;
    }

    /**
     * @return the ref
     */
    public String getRef() {
        return ref;
    }
}