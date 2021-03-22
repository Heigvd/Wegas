/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.tools;

import jdk.nashorn.api.tree.ObjectLiteralTree;

/**
 * Indicated the requested translatableContent exists but there is no translation for the requested
 * language.
 *
 * @author maxence
 */
public class MissingLangageCode extends FishedTranslation {

    /**
     * Start index of the "translations" value. It means the opening brace index
     */
    private int translationsStartPosition;
    /**
     * End index of the "translations" value. It means the closing brace index
     */
    private int translationsEndPosition;

    /**
     * Build from an ObjectLiteralTree which represents the "translations" value
     *
     * @param translations
     */
    public MissingLangageCode(ObjectLiteralTree translations) {
        this.translationsStartPosition = (int) translations.getStartPosition();
        this.translationsEndPosition = (int) translations.getEndPosition();
    }

    /**
     * The the "translations" opening brace index of the translations value
     *
     * @return index of the opening brace
     */
    public int getTranslationsStartPosition() {
        return translationsStartPosition;
    }

    /**
     * get the index of the closing brace of the translations value
     *
     * @return index of the closing brace
     */
    public int getTranslationsEndPosition() {
        return translationsEndPosition;
    }

    /**
     * @return "Not Translated Lang: translations location: start:end"
     */
    @Override
    public String toString() {
        return "Not Translated Lang: translations location: " + translationsStartPosition + ":" + translationsEndPosition;
    }
}
