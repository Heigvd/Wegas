/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.tools;

import com.wegas.core.ejb.nashorn.JSTool;
import org.openjdk.nashorn.api.tree.ExpressionTree;
import org.openjdk.nashorn.api.tree.ObjectLiteralTree;
import org.openjdk.nashorn.api.tree.PropertyTree;

/**
 * The location of a translation in a script.
 *
 * @author maxence
 */
public class FoundTranslation extends FishedTranslation {

    /**
     * Start position of the code key
     */
    private final int langCodeStartPosition;
    /**
     * End position of the code key
     */
    private final int langCodeEndPosition;
    /**
     * Language code
     */
    private final String langCode;

    /**
     * Start position of the translation v2 object
     */
    private final int valueStartPosition;
    /**
     * End position of the translation V2 object
     */
    private final int valueEndPosition;

    /**
     * The translation
     */
    private final String translation;

    /**
     * The status
     */
    private final String status;

    /**
     * Build a FoundTranslation from a AST PropertyTree
     *
     * @param translation propertyTree which represents the translation (v2)
     */
    public FoundTranslation(PropertyTree translation) {
        ExpressionTree key = translation.getKey();
        ObjectLiteralTree value = (ObjectLiteralTree) translation.getValue();

        langCodeStartPosition = (int) key.getStartPosition();
        langCodeEndPosition = (int) key.getEndPosition();
        langCode = JSTool.readStringLiteral(key);

        valueStartPosition = (int) value.getStartPosition();
        valueEndPosition = (int) value.getEndPosition();

        JSTool.getProperty(value, "status");
        this.status = JSTool.readStringLiteral(JSTool.getProperty(value, "status").getValue());
        this.translation = JSTool.readStringLiteral(JSTool.getProperty(value, "translation").getValue());
    }

    /**
     * Get start position of the language code
     *
     * @return start position of the code
     */
    public int getLangCodeStartPosition() {
        return langCodeStartPosition;
    }

    /**
     * Get start position of the language code
     *
     * @return end position of the code
     */
    public int getLangCodeEndPosition() {
        return langCodeEndPosition;
    }

    /**
     * Get the language code
     *
     * @return the code
     */
    public String getLangCode() {
        return langCode;
    }

    /**
     * @return the translation opening brace index
     */
    public int getValueStartPosition() {
        return valueStartPosition;
    }

    /**
     * @returns the translation closing brace index
     */
    public int getValueEndPosition() {
        return valueEndPosition;
    }

    /**
     * @return the translation itself
     */
    public String getTranslation() {
        return translation;
    }

    /**
     * @return status of the translation
     */
    public String getStatus() {
        return status;
    }

    /**
     * @return "Translation CODE (codeStart:end) status =%gt;THE_STATUS&lt;= translation
     *         =%gt;THE_TRANSLATION&lt;= location: start:end
     */
    @Override
    public String toString() {
        return "Translation "
            + langCode + " (" + langCodeStartPosition + ":" + langCodeEndPosition + ")"
            + " status =>" + status + "<="
            + " translation =>" + translation + "<="
            + " location: " + valueStartPosition + ":" + this.valueEndPosition;
    }
}
