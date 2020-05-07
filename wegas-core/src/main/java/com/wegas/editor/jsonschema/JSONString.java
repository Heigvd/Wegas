/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.jsonschema;

public class JSONString extends JSONType {

    public JSONString(boolean nullable) {
        super(nullable);
    }

    @Override
    final public String getType() {
        return "string";
    }
}