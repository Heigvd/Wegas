package com.wegas.editor.jsonschema;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.ArrayList;
import java.util.List;

public final class JSONWRef extends JSONExtendedSchema {

    private final Boolean nullable;

    @JsonProperty("$wref")
    private String ref;

    public JSONWRef(String ref, Boolean nullable) {
        this.ref = ref;
        this.nullable = nullable;
    }

    /**
     * @return the ref
     */
    public String getRef() {
        return ref;
    }

    public Object getType() {
        if (nullable) {
            List<String> types = new ArrayList<>();
            types.add("object");
            types.add("null");
            return types;
        } else {
            return "object";
        }
    }
}
