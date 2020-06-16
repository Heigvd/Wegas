/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.wegas.core.persistence.variable.scope.AbstractScope.ScopeType;
import java.io.IOException;

/**
 * Deserialise ScopeType with backward compatibility (GameScope means GameModelScope)
 *
 * @author maxence
 */
public class ScopeTypeDeserialiser extends StdDeserializer<ScopeType> {

    public ScopeTypeDeserialiser() {
        this(null);
    }

    public ScopeTypeDeserialiser(Class<?> vc) {
        super(vc);
    }

    @Override
    public ScopeType deserialize(JsonParser jp, DeserializationContext dc) throws IOException, JsonProcessingException {
        String value = jp.getValueAsString();
        if (value != null) {
            if (value.equals("GameScope")) {
                return ScopeType.GameModelScope;
            } else {
                // invalid will throw an exception
                return ScopeType.valueOf(value);
            }
        } else {
            // null means default TeamScope
            return ScopeType.TeamScope;
        }
    }
}
