/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.persistence.ListUtils;
import java.io.Serializable;
import java.util.Objects;
import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.Lob;

/**
 *
 * @author maxence
 */
@Embeddable
public class VariableProperty implements Serializable {

    private static final long serialVersionUID = 1647739633795326491L;

    @Column(name = "properties_key")
    private String key;

    @Lob
    @Column(name = "properties")
    private String value;

    public VariableProperty() {
    }

    public VariableProperty(String key, String value) {
        this.key = key;
        this.value = value;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj != null && obj instanceof VariableProperty) {
            VariableProperty other = (VariableProperty) obj;
            return this.key.equals(other.getKey());
        }
        return false;
    }

    public String getKey() {
        return key;
    }

    public void setKey(String key) {
        this.key = key;
    }

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    @Override
    public int hashCode() {
        int hash = 3;
        hash = 79 * hash + Objects.hashCode(this.key);
        return hash;
    }

    public static class Extractor implements ListUtils.EntryExtractor<String, String, VariableProperty> {

        @Override
        public String getKey(VariableProperty item) {
            return item.getKey();
        }

        @Override
        public String getValue(VariableProperty item) {
            return item.getValue();
        }
    }
}
