/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */


package com.wegas.core.rest.util;

import com.fasterxml.jackson.core.JsonGenerator;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonSerializer;
import com.fasterxml.jackson.databind.SerializerProvider;
import java.io.IOException;
import org.graalvm.polyglot.Value;

/**
 *
 * @author maxence
 */


public class PolyglotValueSerialiser extends  JsonSerializer<Value>{

    @Override
    public void serialize(Value value, JsonGenerator jg, SerializerProvider sp) throws IOException, JsonProcessingException {
        jg.writeString(value.toString());
    }

}
