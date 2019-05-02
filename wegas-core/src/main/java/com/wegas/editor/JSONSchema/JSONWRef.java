package com.wegas.editor.JSONSchema;

import com.fasterxml.jackson.annotation.JsonProperty;

public final class JSONWRef extends JSONExtendedSchema {
    @JsonProperty("$wref")
    private String ref;

    public JSONWRef(String ref) {
        this.ref = ref;
    }

    /**
     * @return the ref
     */
    public String getRef() {
        return ref;
    }
}