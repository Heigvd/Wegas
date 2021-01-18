/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.tools;

import com.wegas.core.exception.internal.WegasGraalException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import java.util.List;
import static org.junit.Assert.assertEquals;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Test InScript translation helper methods
 *
 * @author maxence
 */
public class I18nHelperTest {

    private static final Logger logger = LoggerFactory.getLogger(I18nHelperTest.class);

    @Test
    public void testI118nGetTranslatableContent() throws WegasGraalException {
        String script = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        List<TranslatableContent> translatableContents = I18nHelper.getTranslatableContents(script);
        logger.info("TranslatableContent: {}", translatableContents);
    }

    @Test
    public void testI118nGetLocations() throws WegasGraalException {
        String script = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        List<FishedTranslation> translations = I18nHelper.getTranslations(script, "EN");
        logger.info("En translation: {}", translations);
    }

    @Test
    public void testI118nUpdateCode() throws WegasGraalException {
        String script = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        String expected = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FRENCH\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FRENCH\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        String newScript = I18nHelper.updateCodeInScript(script, "FR", "FRENCH");

        logger.info("New     : {}", newScript);
        logger.info("Expected :{}", expected);
        assertEquals("Fail to update language code", expected, newScript);
    }

    @Test
    public void testI118nUpdateStatuses() throws WegasGraalException {
        String script = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        String expected = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"OUTDATED\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"OUTDATED\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        String newScript = I18nHelper.updateStatusInScript(script, 1, "OUTDATED");

        logger.info("New     : {}", newScript);
        logger.info("Expected: {}", expected);
        assertEquals(expected, newScript);
    }

    @Test(expected = WegasGraalException.class)
    public void testSyntaxError() throws WegasGraalException {
        String script = "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, [];";
        I18nHelper.getTranslatableContents(script);
    }

    @Test
    public void testI118nGetLocation() throws WegasGraalException {
        String script = "var tr = {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Thierry\",\"status\":\"outdated\"}}};";

        FoundTranslation translation = (FoundTranslation) I18nHelper.getTranslationLocation(script, 0, "EN");
        logger.info(script);
        logger.info("Translation: {}", translation);
        String code = script.substring(translation.getLangCodeStartPosition(), translation.getLangCodeEndPosition());
        String translations = script.substring(translation.getValueStartPosition(), translation.getValueEndPosition());
        logger.info("Code: {}", code);
        logger.info("Translations: {}", translations);
    }

    @Test
    public void testI118nGetNestedTranslatableContent() throws WegasGraalException {
        String script = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}});";

        List<TranslatableContent> translatableContents = I18nHelper.getTranslatableContents(script);
        logger.info("TranslatableContent: {}", translatableContents);
        assertEquals(1, translatableContents.size());
    }

    @Test
    public void testUpdateTranslations() throws WegasGraalException {
        String script = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"OUTDATED\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"OUTDATED\"}}}});";
        String expected = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Big Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"OUTDATED\"}}}});";
        String expected2 = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Big Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Le Grand Chef\",\"status\":\"\"}}}});";

        String result = I18nHelper.updateScriptWithNewTranslation(script, 0, "EN", "The Big Boss", "");

        String result2 = I18nHelper.updateScriptWithNewTranslation(result, 0, "FR", "Le Grand Chef", "");

        assertEquals(expected, result);
        assertEquals(expected2, result2);
    }

    @Test
    public void testUpdateTranslationsDuplicateCode() throws WegasGraalException {
        String script = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":{\"translation\":\"lowercase\",\"status\":\"\"},\"EN\":{\"translation\":\"UPPERCASE\",\"status\":\"\"}}}});";
        String expected = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":{\"translation\":\"lowercase\",\"status\":\"\"},\"EN\":{\"translation\":\"UP\",\"status\":\"\"}}}});";
        String expected2 = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":{\"translation\":\"low\",\"status\":\"\"},\"EN\":{\"translation\":\"UP\",\"status\":\"\"}}}});";

        String result = I18nHelper.updateScriptWithNewTranslation(script, 0, "EN", "UP", "");
        assertEquals(expected, result);

        String result2 = I18nHelper.updateScriptWithNewTranslation(result, 0, "en", "low", "");
        assertEquals(expected2, result2);
    }

    @Test
    public void testUpdateTranslationsAddNewLang() throws WegasGraalException {
        String script = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{"
            + "\"EN\":{\"translation\":\"in english\",\"status\":\"\"}"
            + "}}});";

        String expected = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{"
            + "\"FR\":{\"translation\":\"en fr\",\"status\":\"\"},"
            + "\"EN\":{\"translation\":\"in english\",\"status\":\"\"}"
            + "}}});";

        String result = I18nHelper.updateScriptWithNewTranslation(script, 0, "FR", "en fr", "");
        assertEquals(expected, result);

        String result2 = I18nHelper.updateScriptWithNewTranslation(script, 0, "fr", "en fr", "");
        assertEquals(expected, result2);
    }
}
