/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class TranslationContentDeserializer extends StdDeserializer<TranslatableContent> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(TranslationContentDeserializer.class);

    public TranslationContentDeserializer() {
        this(null);
    }

    public TranslationContentDeserializer(Class<?> klass) {
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
        } else if (currentToken == JsonToken.START_OBJECT) {
            /*
             a) { "id": 1233, translations:{"en": { translation: "blahblha", status: ""}}
             b) { "id": 1233, translations:{"en": "blahblha"}}
             */
            TranslatableContent trc = new TranslatableContent();
            String fieldName;
            while ((fieldName = p.nextFieldName()) != null) { // NOPMD
                JsonToken nextToken = p.nextToken(); //consume value
                //consume value
                if (nextToken != JsonToken.VALUE_NULL) {
                    switch (fieldName) {

                        case "id":
                            Long id = p.getLongValue();
                            trc.setId(id);
                            break;
                        case "refId":
                            String refId = p.getValueAsString();

                            trc.forceRefId(refId);
                            break;
                        case "version":
                            Long version = p.getValueAsLong();
                            trc.setVersion(version);
                            break;
                        case "translations":
                            String lang;
                            while ((lang = p.nextFieldName()) != null) { // NOPMD
                                JsonToken nextValue = p.nextValue();
                                if (nextValue == JsonToken.VALUE_STRING) {
                                    String translation = p.getValueAsString();
                                    trc.updateTranslation(lang, translation);
                                } else if (nextValue == JsonToken.START_OBJECT) {

                                    String trFieldName;
                                    String translation = "";
                                    String status = "";
                                    while ((trFieldName = p.nextFieldName()) != null) { // NOPMD
                                        p.nextValue(); // consume value
                                        if (trFieldName.equals("translation")) {
                                            translation = p.getValueAsString();
                                        } else if (trFieldName.equals("status")) {
                                            status = p.getValueAsString();
                                        }
                                    }
                                    trc.updateTranslation(lang, translation, status);
                                }
                            }
                            break;
                        default:
                            logger.trace("Skip: {}", fieldName);
                            break;
                    }
                }
            }

            return trc;
        }
        return super.deserializeWithType(p, ctxt, typeDeserializer);
    }

}
