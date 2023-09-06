/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.tools;

import com.oracle.js.parser.ir.Block;
import com.oracle.js.parser.ir.Expression;
import com.oracle.js.parser.ir.LexicalContext;
import com.oracle.js.parser.ir.LiteralNode;
import com.oracle.js.parser.ir.ObjectNode;
import com.oracle.js.parser.ir.PropertyNode;
import com.oracle.js.parser.ir.visitor.NodeVisitor;
import com.wegas.core.ejb.nashorn.JSTool;
import com.wegas.core.exception.internal.WegasGraalException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.Mergeable;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import org.apache.commons.text.StringEscapeUtils;

/**
 * Some functions to play with translations nested in script.
 *
 * @author maxence
 */
public class I18nHelper {

    private I18nHelper() {
        // empty private constructor to prevent class initialisation
    }

    /**
     * Is the given object represents an instance of the given class ? The check is done by
     * comparing the "@class" property value.
     *
     * @param properties all properties of the object (extracted by
     *                   {@link #getProperty(jdk.nashorn.api.tree.ObjectNode, java.lang.String) getProperties}
     * @param klass      the class to test against
     *
     * @return true if the object is an instance of the class
     */
    private static boolean isInstanceOf(Map<String, Expression> properties, Class<? extends Mergeable> klass) {
        String jsonClassName = Mergeable.getJSONClassName(klass);
        String atClass = JSTool.readStringLiteral(properties.get("@class"));
        return jsonClassName.equals(atClass);
    }

    /**
     * Check if the given object contains v2 translation. I18nV1 object contains only translations,
     * v2 add a status for each translation.4 V1 example:
     * <p>
     * V1 example:
     * <pre>{
     *   @class:"TranslatableContent",
     *   translations: {
     *     EN: "Hello"
     *   }
     * }
     * </pre>
     * </p>
     * <p>
     * V2 example:
     * <pre>{
     *   @class:"TranslatableContent",
     *   translations: {
     *     EN: {
     *       translation: "Hello",
     *       status: "outdated"
     *     }
     *   }
     * }
     * </pre>
     * </p>
     *
     * @param properties all properties of the object (extracted by
     *                   {@link #getProperty(jdk.nashorn.api.tree.ObjectNode, java.lang.String) getProperties}
     *
     * @return true if object match i18v2 tree
     */
    private static boolean isTranslatableContentV2(Map<String, Expression> properties) {
        Expression get = properties.get("translations");
        if (get instanceof ObjectNode) {
            List<PropertyNode> langs = ((ObjectNode) get).getElements();

            return langs.isEmpty() || (langs.get(0).getValue() instanceof ObjectNode);
        }
        return false;
    }

    private static boolean isTranslatableContentV2(ObjectNode node) {
        PropertyNode get = JSTool.getProperty(node, "translations");
        if (get != null && get.getValue() instanceof ObjectNode) {
            List<PropertyNode> langs = ((ObjectNode) get.getValue()).getElements();
            for (PropertyNode lang : langs) {
                if (lang.getValue() instanceof ObjectNode == false) {
                    // at least one language is still v1
                    return false;
                }
            }
            return true;
        }
        return false;
    }

    /**
     * Convert ObjectLiteral Tree node to a TranslatableContent object
     *
     * @param node AST node to convert
     *
     * @return the object read or null if node is not of correct type
     */
    private static TranslatableContent readTranslatableContent(ObjectNode node) {
        Map<String, Expression> properties = JSTool.mapProperties(node);
        if (isInstanceOf(properties, TranslatableContent.class)) {
            TranslatableContent trc = new TranslatableContent();

            Expression langs = properties.get("translations");

            if (langs instanceof ObjectNode) {
                for (PropertyNode lang : ((ObjectNode) langs).getElements()) {
                    String code = JSTool.readStringLiteral(lang.getKey());
                    if (code != null) {
                        Expression trNode = lang.getValue();
                        if (trNode instanceof ObjectNode) {
                            Map<String, Expression> trProps = JSTool.mapProperties(((ObjectNode) trNode));
                            String status = JSTool.readStringLiteral(trProps.get("status"));
                            String translation = JSTool.readStringLiteral(trProps.get("translation"));
                            trc.updateTranslation(code, translation, status);
                        }
                    }
                }
            }

            return trc;
        } else {
            return null;
        }
    }

    /**
     * Find the location of the index-th translation in the script that corresponds to the given
     * language.
     *
     * @param script the script to analyse
     * @param index  index of the translatableContent to fetch
     * @param code   code of the language to fetch
     *
     * @return the fished translation with location information
     */
    public static FishedTranslation getTranslationLocation(String script, Integer index,
        String code) throws WegasGraalException {
        List<FishedTranslation> translations = getTranslations(script, code);
        if (translations.size() > index) {
            return translations.get(index);
        } else {
            return new MissingTranslationContent();
        }
    }

    /**
     * Get location of all translations of the given language in the script.
     *
     * @param script   the script to analyse
     * @param langCode language code
     *
     * @return list of all fetched translation. Size of the list will match the number of
     *         translatableContent in the script.
     */
    public static List<FishedTranslation> getTranslations(String script, String langCode) throws WegasGraalException {
        List<FishedTranslation> result = new ArrayList<>();

        List<ObjectNode> trs = getTranslatableContentTrees(script);
        for (ObjectNode node : trs) {
            if (node != null) {
                ObjectNode translations = (ObjectNode) JSTool.getProperty(node, "translations").getValue();
                PropertyNode translation = JSTool.getProperty(translations, langCode);
                if (translation != null) {
                    result.add(new FoundTranslation(translation));
                } else {
                    result.add(new MissingLangageCode(translations));
                }
            }
        }

        return result;
    }

    /**
     * Extract index-th TranslatableContent AST.
     *
     * @param script the script to analyse.
     * @param index  index of the translatableContent to extract
     *
     * @return AST of the index-th TranslatableContent or null if there is no such
     *         translatableContent
     */
    private static ObjectNode getTranslationsByIndex(String script, Integer index) throws WegasGraalException {
        List<ObjectNode> trs = getTranslatableContentTrees(script);
        if (trs.size() > index) {
            return trs.get(index);
        } else {
            return null;
        }
    }

    /**
     * Extract all translatableContent found in the script
     *
     * @param script the script to analyse
     *
     * @return list of all translatable content found in the script
     */
    public static List<TranslatableContent> getTranslatableContents(String script) throws WegasGraalException {
        List<TranslatableContent> trs = new ArrayList<>();

        for (ObjectNode node : getTranslatableContentTrees(script)) {
            if (node != null) {
                trs.add(readTranslatableContent(node));
            } else {
                trs.add(null);
            }
        }
        return trs;
    }

    private static String updateScript(List<InScriptChange> changes, String script) throws WegasGraalException {
        if (!changes.isEmpty()) {
            StringBuilder sb = new StringBuilder(script);

            // Soret changes by last index first
            Collections.sort(changes, new Comparator<InScriptChange>() {
                @Override
                public int compare(InScriptChange o1, InScriptChange o2) {
                    return o1.startIndex < o2.startIndex ? 1 : -1;
                }
            });

            for (InScriptChange change : changes) {
                change.apply(sb);
            }
            return assertScriptIsParsable(sb.toString());
        }
        return script;
    }

    /**
     * Update all statues of the index-th translatableContent in the script.
     *
     * @param script    the script to update
     * @param index     index of the translatable content to update
     * @param newStatus new status
     *
     * @return updated script
     *
     * @throws WegasGraalException if the given script (or the updated one) is not parseable
     */
    public static String updateStatusInScript(String impact, int index, String newStatus) throws WegasGraalException {
        ObjectNode node = I18nHelper.getTranslationsByIndex(impact, index);

        if (node != null && isTranslatableContentV2(node)) {

            List<InScriptChange> changes = new ArrayList<>();
            ObjectNode langs = (ObjectNode) JSTool.getProperty(node, "translations").getValue();

            for (PropertyNode lang : langs.getElements()) {
                ObjectNode translation = (ObjectNode) lang.getValue();

                Map<String, Expression> props = JSTool.mapProperties(translation);
                if (props.containsKey("status")) {
                    LiteralNode get = (LiteralNode) props.get("status");
                    changes.add(new InScriptChange((int) get.getStart(), (int) get.getFinish(), newStatus));

                }
            }
            return I18nHelper.updateScript(changes, impact);
        } else {
            return impact;
        }
    }

    /**
     * update all occurrence of the language oldCode to new newCode
     *
     * @param script  source to process
     * @param oldCode old language code
     * @param newCode new language code
     *
     * @return script with up-to-date language code
     *
     * @throws WegasGraalException if the given script (or the updated one) is not parseable
     */
    public static String updateCodeInScript(String script, String oldCode, String newCode) throws WegasGraalException {
        List<FishedTranslation> results = I18nHelper.getTranslations(script, oldCode);

        if (!results.isEmpty()) {
            List<InScriptChange> changes = new ArrayList<>();
            for (FishedTranslation result : results) {
                if (result instanceof FoundTranslation) {
                    FoundTranslation found = (FoundTranslation) result;
                    changes.add(new InScriptChange(
                        found.getLangCodeStartPosition(),
                        found.getLangCodeEndPosition(), newCode));
                }
            }

            return I18nHelper.updateScript(changes, script);
        } else {
            return script;
        }
    }

    /**
     * In the index-th translatableContent of the script, update the code translation. Set
     * translation text to newValue and set status to newTrStatus.
     *
     * @param script      script to process
     * @param index       index of the translatable content to update
     * @param code        language to update
     * @param newValue    the new text
     * @param newTrStatus the new status
     *
     * @return updated script
     *
     * @throws WegasGraalException if the given script (or the updated one) is not parseable
     */
    public static String updateScriptWithNewTranslation(String script, int index, String code, String newValue, String newTrStatus) throws WegasGraalException {

        FishedTranslation result;

        if (code.equals(code.toUpperCase())) {
            // provided code is upper-case
            result = getTranslationLocation(script, index, code);
        } else {
            // provided code is lowerCase (backward compatibility, this should'nt be used)
            FishedTranslation lowerCaseResult = getTranslationLocation(script, index, code);
            if (lowerCaseResult instanceof FoundTranslation) {
                // there is a lowerCase code in the script
                result = lowerCaseResult;
            } else {
                FishedTranslation upperCaseResult = getTranslationLocation(script, index, code.toUpperCase());
                if (upperCaseResult instanceof FoundTranslation
                    || upperCaseResult instanceof MissingLangageCode) {
                    result = upperCaseResult;
                } else {
                    result = lowerCaseResult;
                }
            }
        }

        if (result != null) {
            String escapedNewValue = StringEscapeUtils.escapeJson(newValue);

            String previousStatus;
            String translation;

            if (result instanceof FoundTranslation) {
                FoundTranslation theResult = (FoundTranslation) result;
                previousStatus = theResult.getStatus();

                translation = "{"
                    + "\"translation\":\"" + escapedNewValue + "\","
                    + "\"status\":\"" + (newTrStatus != null ? newTrStatus : previousStatus) + "\""
                    + "}";

                Integer startIndex = theResult.getValueStartPosition();
                Integer endIndex = theResult.getValueEndPosition();

                if (startIndex != null && endIndex != null) {
                    // update existing newTranslation
                    StringBuilder sb = new StringBuilder(script);
                    sb.replace(startIndex, endIndex, translation);
                    return assertScriptIsParsable(sb.toString());
                }
            } else if (result instanceof MissingLangageCode) {
                MissingLangageCode theResult = (MissingLangageCode) result;

                translation = "{"
                    + "\"translation\":\"" + escapedNewValue + "\","
                    + "\"status\":\"" + (newTrStatus != null ? newTrStatus : "") + "\""
                    + "}";

                Integer startIndex = theResult.getTranslationsStartPosition();
//                Integer endIndex = theResult.getTranslationsEndPosition();

                StringBuilder sb = new StringBuilder(script);
                // insert new code property right after opening bracket
                sb.replace(startIndex + 1, startIndex + 1, "\"" + code.toUpperCase() + "\":" + translation + ",");
                return assertScriptIsParsable(sb.toString());

            }/* else if (result instanceof MissingTranslationContent) {
                // noop
            }*/
        }
        return script;
    }

    /**
     * Try to parse the given script and throw execption if it is not parseable.
     *
     * @param script the script to parse
     *
     * @throws WegasGraalException
     */
    private static String assertScriptIsParsable(String script) throws WegasGraalException {
        Block parse = JSTool.parse(script);
        if (parse != null) {
            return script;
        } else {
            throw new WegasGraalException(null);
        }
    }

    /**
     * Extract all TranslatableContent AST.
     *
     * @param script the script to analyse.
     *
     * @return AST of all TranslatableContent
     */
    private static List<ObjectNode> getTranslatableContentTrees(String script) {
        Block parse = JSTool.parse(script);
        List<ObjectNode> trs = new ArrayList<>();

        parse.accept(new NodeVisitor<LexicalContext>(new LexicalContext()) {
            @Override
            public boolean enterObjectNode(ObjectNode node) {
                Map<String, Expression> mapProperties = JSTool.mapProperties(node);

                if (isInstanceOf(mapProperties, TranslatableContent.class)) {
                    if (isTranslatableContentV2(mapProperties)) {
                        // accumulate v2 only
                        trs.add(node);
                    } else {
                        // but add null to keep track of all translatable content to preserve index-ness
                        trs.add(null);
                    }
                    return false;
                } else {
                    // not a TranslatableContent, call default implematation from super
                    return super.enterObjectNode(node);
                }
            }
        });

        return trs;
    }

    /**
     * Internal structure to store update to be applied on script. In in indicate
     */
    private static final class InScriptChange {

        /**
         * Index of the start position
         */
        private final int startIndex;
        /**
         * index of the end position
         */
        private final int endIndex;

        /**
         * the new value to insert within bounds
         */
        private final String newValue;

        /**
         * Plan to replace sub-string from start to end indexes with newValue.
         *
         * @param startIndex from this index
         * @param endIndex   to this index
         * @param newValue   new value to set
         */
        public InScriptChange(int startIndex, int endIndex, String newValue) {
            this.startIndex = startIndex;
            this.endIndex = endIndex;
            this.newValue = newValue;
        }

        /**
         * Apply changes on the given buffer
         *
         * @param buffer string to update
         */
        public void apply(StringBuilder buffer) {
            buffer.replace(this.startIndex, this.endIndex, "\"" + this.newValue + "\"");
        }
    }

}
