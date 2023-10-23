/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.messaging.persistence;

import ch.albasim.wegas.annotations.CommonView;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.fasterxml.jackson.databind.jsontype.TypeDeserializer;
import com.wegas.core.ejb.RequestManager.RequestContext;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.editor.view.I18nFileView;
import java.io.IOException;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
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
public class Attachment extends AbstractEntity implements Serializable {

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
    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty(
            optional =false, nullable =false,
            view= @View(
                label = "File",
                value = I18nFileView.class,
                layout = CommonView.LAYOUT.shortInline
            ))
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
    public Collection<WegasPermission> getRequieredReadPermission(RequestContext context) {
        if (this.message != null) {
            return this.message.getRequieredReadPermission(context);
        }
        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission(RequestContext context) {
        if (this.message != null) {
            return this.message.getRequieredUpdatePermission(context);
        }

        return null;
    }

    /*@Override
    public boolean isProtected() {
        if (this.getMessage() != null) {
            return this.getMessage().isProtected();
        }
        return false;
    }*/

    @Override
    public WithPermission getMergeableParent() {
        return this.getMessage();
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
                        item.setFile(TranslatableContent.build("en", strItem));
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
                return TranslatableContent.build("en", p.getText());
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
