/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.deepl;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.util.List;

/**
 * DeepL translate response.
 *
 * @author maxence
 */
public class DeeplTranslations {

    private List<DeeplTranslation> translations;

    public List<DeeplTranslation> getTranslations() {
        return translations;
    }

    public void setTranslations(List<DeeplTranslation> translations) {
        this.translations = translations;
    }

    public static final class DeeplTranslation {

        private String text;

        @JsonProperty("detected_source_language")
        private String lang;

        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public String getLang() {
            return lang;
        }

        public void setLang(String lang) {
            this.lang = lang;
        }
    }
}
