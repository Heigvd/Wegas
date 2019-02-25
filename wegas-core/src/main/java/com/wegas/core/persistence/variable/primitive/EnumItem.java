/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.deser.std.StdDeserializer;
import com.fasterxml.jackson.databind.jsontype.TypeDeserializer;
import com.wegas.core.Helper;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.i18n.persistence.TranslationContentDeserializer;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.LabelledEntity;
import com.wegas.core.persistence.Orderable;
import com.wegas.core.persistence.WithPermission;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import com.wegas.reviewing.persistence.evaluation.CategorizedEvaluationDescriptor;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.OneToOne;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

/**
 *
 * @author maxence
 */
@Entity
@Table(
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"parentevaluation_id", "parentstring_id", "name"})
        },
        indexes = {
            @Index(columnList = "label_id"),
            @Index(columnList = "parentevaluation_id"),
            @Index(columnList = "parentstring_id")
        }
)
public class EnumItem extends AbstractEntity implements LabelledEntity, Orderable {

    private static final long serialVersionUID = 1L;

    @ManyToOne
    @JsonIgnore
    private CategorizedEvaluationDescriptor parentEvaluation;

    @ManyToOne
    @JsonIgnore
    private StringDescriptor parentString;

    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;

    /**
     * Internal identifier
     */
    @WegasEntityProperty(searchable = true)
    private String name;

    @Column(name = "item_order")
    @JsonIgnore
    private Integer order;

    @OneToOne(cascade = CascadeType.ALL, orphanRemoval = true)
    @WegasEntityProperty
    @JsonDeserialize(using = TranslationContentDeserializer.class)
    private TranslatableContent label;

    @Override
    public Long getId() {
        return id;
    }

    /**
     * @return the label
     */
    @Override
    public TranslatableContent getLabel() {
        return label;
    }

    /**
     * @param label the label to set
     */
    @Override
    public void setLabel(TranslatableContent label) {
        this.label = label;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public void setName(String name) {
        this.name = name;
    }

    @Override
    public Integer getOrder() {
        return order;
    }

    public void setOrder(Integer order) {
        this.order = order;
    }

    public CategorizedEvaluationDescriptor getParentEvaluation() {
        return parentEvaluation;
    }

    public void setParentEvaluation(CategorizedEvaluationDescriptor parentEvaluation) {
        this.parentEvaluation = parentEvaluation;
        if (this.parentEvaluation != null) {
            // set other parents to null
            this.setParentString(null);
            if (this.parentEvaluation.getContainer() != null && this.getLabel() != null) {
                this.getLabel().setParentDescriptor(parentEvaluation.getContainer().getParent());
            }
        }
    }

    public StringDescriptor getParentString() {
        return parentString;
    }

    public void setParentString(StringDescriptor parentString) {
        this.parentString = parentString;
        if (this.parentString != null) {
            this.setParentEvaluation(null);
            if (this.getLabel() != null) {
                this.getLabel().setParentDescriptor(parentString);
            }
        }
    }

    @Override
    public WithPermission getMergeableParent() {
        if (this.getParentString() != null) {
            return getParentString();
        } else {
            return getParentEvaluation();
        }
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        if (this.parentEvaluation != null) {
            return parentEvaluation.getRequieredReadPermission();
        } else if (this.parentString != null) {
            return parentString.getRequieredReadPermission();
        }

        return null;
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        if (this.parentEvaluation != null) {
            return parentEvaluation.getRequieredUpdatePermission();
        } else if (this.parentString != null) {
            return parentString.getRequieredUpdatePermission();
        }

        return null;
    }

    public static class ListDeserializer extends StdDeserializer<List<EnumItem>> {

        private static final long serialVersionUID = 1L;

        public ListDeserializer() {
            this(null);
        }

        public ListDeserializer(Class<?> klass) {
            super(klass);
        }

        @Override
        public List<EnumItem> deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
            return this.deserialize(p, ctxt, new ArrayList<>());
        }

        @Override
        public List<EnumItem> deserialize(JsonParser p, DeserializationContext ctxt,
                List<EnumItem> items) throws IOException, JsonProcessingException {
            JsonToken currentToken = p.currentToken();
            if (currentToken == JsonToken.START_ARRAY) {

                do {
                    currentToken = p.nextToken();

                    if (currentToken == JsonToken.VALUE_STRING) {
                        String strItem = p.getText();
                        EnumItem item = new EnumItem();
                        item.setLabel(TranslatableContent.build("en", strItem));
                        item.setName(strItem);
                        items.add(item);
                    } else if (currentToken == JsonToken.START_OBJECT) {
                        EnumItem item = JacksonMapperProvider.getMapper().readValue(p, EnumItem.class);
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
}
