/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.i18n.tools;

import com.wegas.core.exception.internal.WegasNashornException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import java.util.List;
import static org.junit.Assert.assertEquals;
import org.junit.Test;

/**
 * Test InScript translation helper methods
 *
 * @author maxence
 */
public class I18nHelperTest {

    @Test
    public void testI118nGetTranslatableContent() throws WegasNashornException {
        String script = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        List<TranslatableContent> translatableContents = I18nHelper.getTranslatableContents(script);
        System.out.println("TranslatableContent: " + translatableContents);
    }

    @Test
    public void testI118nGetLocations() throws WegasNashornException {
        String script = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        List<FishedTranslation> translations = I18nHelper.getTranslations(script, "EN");
        System.out.println("EN Translation " + translations);
    }

    @Test
    public void testI118nUpdateCode() throws WegasNashornException {
        String script = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        String expected = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FRENCH\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FRENCH\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        String newScript = I18nHelper.updateCodeInScript(script, "FR", "FRENCH");

        System.out.println("New     :" + newScript);
        System.out.println("Expected:" + expected);
        assertEquals(expected, newScript);
    }

    @Test
    public void testI118nUpdateStatuses() throws WegasNashornException {
        String script = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        String expected = "Variable.find(gameModel, \"managementApproval\").add(self, -10);\n"
            + "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"OUTDATED\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"OUTDATED\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, []);";

        String newScript = I18nHelper.updateStatusInScript(script, 1, "OUTDATED");

        System.out.println("New     :" + newScript);
        System.out.println("Expected:" + expected);
        assertEquals(expected, newScript);
    }

    @Test(expected = WegasNashornException.class)
    public void testSyntaxError() throws WegasNashornException {
        String script = "sendMessage({\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"Welcome\",\"status\":\"\"},\"FR\":{\"translation\":\"Salut !\",\"status\":\"\"}}}, {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":\"<p>Welcome back, old fellow !</p>\",\"FR\":\"<p>Bon retour parmi nous, vieille branche</p>\"}}, [];";
        List<TranslatableContent> translatableContents = I18nHelper.getTranslatableContents(script);
    }

    @Test
    public void testI118nGetLocation() throws WegasNashornException {
        String script = "var tr = {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Thierry\",\"status\":\"outdated\"}}};";

        FoundTranslation translation = (FoundTranslation) I18nHelper.getTranslationLocation(script, 0, "EN");
        System.out.println(script);
        System.out.println("Translation: " + translation);
        String code = script.substring(translation.getLangCodeStartPosition(), translation.getLangCodeEndPosition());
        String translations = script.substring(translation.getValueStartPosition(), translation.getValueEndPosition());
        System.out.println("Code: " + code);
        System.out.println("Translations: " + translations);
    }

    @Test
    public void testI118nGetNestedTranslatableContent() throws WegasNashornException {
        String script = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"\"}}}});";

        List<TranslatableContent> translatableContents = I18nHelper.getTranslatableContents(script);
        System.out.println("TranslatableContent: " + translatableContents);
        assertEquals(1, translatableContents.size());
    }

    @Test
    public void testUpdateTranslations() throws WegasNashornException {
        String script = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Boss\",\"status\":\"OUTDATED\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"OUTDATED\"}}}});";
        String expected = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Big Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Grand Chef\",\"status\":\"OUTDATED\"}}}});";
        String expected2 = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"EN\":{\"translation\":\"The Big Boss\",\"status\":\"\"},\"FR\":{\"translation\":\"Le Grand Chef\",\"status\":\"\"}}}});";

        String result = I18nHelper.updateScriptWithNewTranslation(script, 0, "EN", "The Big Boss", "");

        String result2 = I18nHelper.updateScriptWithNewTranslation(result, 0, "FR", "Le Grand Chef", "");

        assertEquals(expected, result);
        assertEquals(expected2, result2);
    }

    @Test
    public void testUpdateTranslationsDuplicateCode() throws WegasNashornException {
        String script = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":{\"translation\":\"lowercase\",\"status\":\"\"},\"EN\":{\"translation\":\"UPPERCASE\",\"status\":\"\"}}}});";
        String expected = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":{\"translation\":\"lowercase\",\"status\":\"\"},\"EN\":{\"translation\":\"UP\",\"status\":\"\"}}}});";
        String expected2 = "sendMessage({\"theMessage\": {\"@class\":\"TranslatableContent\",\"translations\":{\"en\":{\"translation\":\"low\",\"status\":\"\"},\"EN\":{\"translation\":\"UP\",\"status\":\"\"}}}});";

        String result = I18nHelper.updateScriptWithNewTranslation(script, 0, "EN", "UP", "");
        assertEquals(expected, result);

        String result2 = I18nHelper.updateScriptWithNewTranslation(result, 0, "en", "low", "");
        assertEquals(expected2, result2);
    }

    @Test
    public void testUpdateTranslationsAddNewLang() throws WegasNashornException {
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
