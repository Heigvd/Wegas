/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.persistence;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.persistence.ListUtils;
import java.io.Serializable;
import java.util.Objects;
import javax.persistence.Basic;
import javax.persistence.Column;
import javax.persistence.Embeddable;
import javax.persistence.FetchType;
import javax.persistence.Lob;

/**
 *
 * Based on VariableProperty but with @Lob
 *
 * @author maxence
 */
@Embeddable
public class Translation implements Serializable {

    private static final long serialVersionUID = 1647739633795326491L;

    @JsonIgnore
    private String lang;

    @Lob
    @Basic(fetch = FetchType.EAGER) // CARE, lazy fetch on Basics has some trouble.
    @Column(name = "tr")
    private String translation;

    private String status;

    public Translation() {
    }

    public Translation(String lang, String translation) {
        this(lang, translation, null);
    }

    public Translation(String lang, String translation, String status) {
        this.lang = lang;
        this.translation = translation;
        this.status = status;
    }

    @Override
    public int hashCode() {
        int hash = 3;
        hash = 79 * hash + Objects.hashCode(this.lang);
        return hash;
    }

    @Override
    public boolean equals(Object obj) {
        if (obj != null && obj instanceof Translation) {
            Translation other = (Translation) obj;
            return this.getLang().equals(other.getLang())
                    && Objects.equals(this.getTranslation(), other.getTranslation());
        }
        return false;
    }

    public String getLang() {
        return lang != null ? lang.toUpperCase() : null;
    }

    public void setLang(String lang) {
        if (lang != null) {
            this.lang = lang.toUpperCase();
        } else {
            this.lang = null;
        }
    }

    public String getTranslation() {
        return translation;
    }

    public void setTranslation(String translation) {
        this.translation = translation;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    @Override
    public String toString() {
        return "Translation [" + lang + "] " + translation;
    }

    public static class Mapper implements ListUtils.EntryExtractor<String, Translation, Translation> {

        @Override
        public String getKey(Translation item) {
            return item.getLang();
        }

        @Override
        public Translation getValue(Translation item) {
            return item;
        }
    }
}
