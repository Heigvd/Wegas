/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.persistence;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.fasterxml.jackson.databind.jsontype.TypeDeserializer;
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.IOException;

/**
 *
 * @author maxence
 */
public class TranslationDeserializer extends StdDeserializer<TranslatableContent> {

    private static final long serialVersionUID = 1L;

    public TranslationDeserializer() {
        this(null);
    }

    public TranslationDeserializer(Class<?> klass) {
        super(klass);
    }

    @Override
    public TranslatableContent deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
        JsonToken currentToken = p.currentToken();
        if (currentToken == JsonToken.VALUE_STRING) {
            return TranslatableContent.build("en", p.getText());
        }
        return JacksonMapperProvider.getMapper().readValue(p, TranslatableContent.class);
    }

    @Override
    public TranslatableContent deserialize(JsonParser p, DeserializationContext ctxt, TranslatableContent intoValue) throws IOException, JsonProcessingException {
        JsonToken currentToken = p.currentToken();
        if (currentToken == JsonToken.VALUE_STRING) {
            intoValue.updateTranslation("en", p.getText());
        }
        return super.deserialize(p, ctxt, intoValue);
    }

    @Override
    public Object deserializeWithType(JsonParser p, DeserializationContext ctxt, TypeDeserializer typeDeserializer) throws IOException {
        JsonToken currentToken = p.currentToken();
        if (currentToken == JsonToken.VALUE_STRING) {
            return TranslatableContent.build("en", p.getText());
        }
        return super.deserializeWithType(p, ctxt, typeDeserializer);
    }

}
