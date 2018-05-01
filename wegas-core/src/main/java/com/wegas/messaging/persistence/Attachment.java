/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.fasterxml.jackson.databind.jsontype.TypeDeserializer;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationDeserializer;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.Searchable;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import java.io.IOException;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import jdk.nashorn.api.scripting.JSObject;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

/**
 *
 * @author maxence
 */
@Entity
@Table(
        indexes = {
            @Index(columnList = "message_id"),
            @Index(columnList = "file_id")
        }
)
public class Attachment extends AbstractEntity implements Serializable, Searchable {

    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    private static final long serialVersionUID = 1L;

    @ManyToOne
    @JsonIgnore
    private Message message;

    /**
     * URI
     */
    @JsonDeserialize(using = TranslationDeserializer.class)
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    private TranslatableContent file;

    @Override
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Message getMessage() {
        return message;
    }

    public void setMessage(Message message) {
        this.message = message;
    }

    public TranslatableContent getFile() {
        return file;
    }

    public void setFile(TranslatableContent file) {
        this.file = file;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        if (this.message != null) {
            return this.message.getRequieredReadPermission();
        }
        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        if (this.message != null) {
            return this.message.getRequieredUpdatePermission();
        }

        return null;
    }

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof Attachment) {
            Attachment o = (Attachment) other;
            this.setFile(TranslatableContent.merger(this.getFile(), o.getFile()));
        }
    }

    @Override
    public Boolean containsAll(List<String> criterias) {
        return this.getFile().containsAll(criterias);
    }

    public static class ListDeserializer extends StdDeserializer<List<Attachment>> {

        private static final long serialVersionUID = 1L;

        public ListDeserializer() {
            this(null);
        }

        public ListDeserializer(Class<?> klass) {
            super(klass);
        }

        @Override
        public List<Attachment> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
            return this.deserialize(p, ctxt, new ArrayList<>());
        }

        @Override
        public List<Attachment> deserialize(JsonParser p, DeserializationContext ctxt,
                List<Attachment> items) throws IOException, JsonProcessingException {
            JsonToken currentToken = p.currentToken();
            if (currentToken == JsonToken.START_ARRAY) {

                do {
                    currentToken = p.nextToken();

                    if (currentToken == JsonToken.VALUE_STRING) {
                        String strItem = p.getText();
                        Attachment item = new Attachment();
                        item.setFile(TranslatableContent.build("def", strItem));
                        items.add(item);
                    } else if (currentToken == JsonToken.START_OBJECT) {
                        Attachment item = JacksonMapperProvider.getMapper().readValue(p, Attachment.class);
                        items.add(item);
                    } else {
                        break;
                    }
                } while (currentToken != null);

            }
            return items;
        }

        @Override
        public Object deserializeWithType(JsonParser p, DeserializationContext ctxt,
                TypeDeserializer typeDeserializer) throws IOException {
            JsonToken currentToken = p.currentToken();
            if (currentToken == JsonToken.VALUE_STRING) {
                return TranslatableContent.build("def", p.getText());
            }
            return super.deserializeWithType(p, ctxt, typeDeserializer);
        }

    }

    public static Attachment readFromNashorn(JSObject att) {
        if (att != null) {
            Object theClass = att.getMember("@class");
            Attachment attachment = new Attachment();

            if (theClass != null && theClass.equals("Attachment")) {
                ScriptObjectMirror trs = (ScriptObjectMirror) att.getMember("file");
                TranslatableContent file = TranslatableContent.readFromNashorn(trs);
                attachment.setFile(file);
            }
            return attachment;
        } else {
            return null;
        }
    }
}
