/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.unit.pmg;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Tag;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public class LanguageTest extends PMGameAbstractTest {

    @Test
    @Tag("PrivateRelatedTest")
    public void testLanguage() {
        this.evalScript("PMGTest.testAll()");
    }

    @Override
    protected String getGameModelPath() {
        return "src/main/webapp/wegas-private/wegas-pmg/db/wegas-pmg-gamemodel-language.json";
    }

    @Override
    protected String getScriptTestPath() {
        return "test-scripts/wegas-pmg-server-test-language.js";
    }
}
