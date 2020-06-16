/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.unit.pmg;

import org.junit.Test;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public class LanguageTest extends PMGameAbstractTest {

    @Test
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
