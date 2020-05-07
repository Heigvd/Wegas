/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.jsonschema;

/**
 * JSON type which represents a identified.
 *
 * @author maxence
 */
public class JSONIdentifier extends JSONType {

    public JSONIdentifier() {
        super(false);
    }

    @Override
    final public String getType() {
        return "identifier";
    }
}
