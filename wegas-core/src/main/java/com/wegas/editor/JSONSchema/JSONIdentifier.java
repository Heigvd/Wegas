/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.JSONSchema;

/**
 * JSON type which represents a identified.
 *
 * @author maxence
 */
public class JSONIdentifier extends JSONType {

    @Override
    final public String getType() {
        return "identifier";
    }
}
