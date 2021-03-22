/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.jsonschema;

public class JSONNumber extends JSONType {

    public JSONNumber(boolean nullable) {
        super(nullable);
    }

    @Override
    final public String getType() {
        return "number";
    }

}
