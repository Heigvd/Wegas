/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.jsonschema;

import ch.albasim.wegas.annotations.JSONSchema;
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