/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.unit.i18n;

import com.wegas.utils.AbstractTest;
import java.io.IOException;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public abstract class AbstractClientLanguageTest extends AbstractTest {

    public static final String SCRIPTROOT = "src/main/webapp/";

    protected abstract List<String> getScripts();

    @BeforeEach
    public void setUpGM() throws IOException {
        /* insert script from files*/
        List<String> scripts = this.getScripts();
        scripts.add(0, SCRIPTROOT + "wegas-app/tests/scripts/test-i18n-client.js");
        String[] aScripts = new String[scripts.size()];

        //guestLogin();
        this.createGameModelFromFileWithConcatenatedScript(this.getGameModelPath(), scripts.toArray(aScripts));
    }

    @Test
    public void testLanguage() {
        this.evalScript("I18nTest.testAll()");
    }

    protected String getGameModelPath() {
        return "src/main/webapp/wegas-app/db/wegas-empty-gamemodel.json";
    }
}
