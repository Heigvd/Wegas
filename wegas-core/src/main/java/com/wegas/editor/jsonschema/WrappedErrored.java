/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.jsonschema;

import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.annotations.WegasConditions;
import java.lang.reflect.InvocationTargetException;

/**
 *
 * @author maxence
 */
public class WrappedErrored {

    private final WegasConditions.Condition condition;
    private String message;

    public WrappedErrored(Errored errored) {
        try {
            this.condition = errored.value().getDeclaredConstructor().newInstance();
            this.message = errored.message();
        } catch (NoSuchMethodException | SecurityException | InstantiationException | IllegalAccessException | IllegalArgumentException | InvocationTargetException ex) {
            throw WegasErrorMessage.error("Invalid condition " + errored);
        }
    }

    public WegasConditions.Condition getCondition() {
        return condition;
    }

    public String getMessage() {
        return message;
    }
}
