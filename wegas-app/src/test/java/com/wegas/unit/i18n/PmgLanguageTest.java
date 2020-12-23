/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.unit.i18n;

import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class PmgLanguageTest extends AbstractClientLanguageTest {

    @Test
    @Tag("PrivateRelatedTest")
    @Override
    public void testLanguage() {
        // overriden to categorize the test
        this.evalScript("I18nTest.testAll()");
    }

    @Override
    protected List<String> getScripts() {
        List<String> scripts = new ArrayList<>();
        scripts.add(SCRIPTROOT + "wegas-private/wegas-pmg/js/i18n/i18n-pmg-en.js");
        scripts.add(SCRIPTROOT + "wegas-private/wegas-pmg/js/i18n/i18n-pmg-fr.js");
        return scripts;
    }

}
