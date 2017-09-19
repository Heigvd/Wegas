/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.unit.i18n;

import com.wegas.unit.AbstractEJBContainerTest;
import java.io.IOException;
import java.util.List;
import org.glassfish.embeddable.GlassFishException;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public abstract class AbstractClientLanguageTest extends AbstractEJBContainerTest {

    public static final String SCRIPTROOT = "src/main/webapp/";

    protected abstract List<String> getScripts();

    @Before
    public void setUpGM() throws IOException, GlassFishException {
        /* insert script from files*/
        List<String> scripts = this.getScripts();
        scripts.add(0, SCRIPTROOT + "wegas-app/tests/scripts/test-i18n-client.js");
        String[] aScripts = new String[scripts.size()];

        //guestLogin();
        this.createGameModelFromFileWithConcatenatedScript(this.getGameModelPath(), scripts.toArray(aScripts));
    }

    @After
    public void cleanGM() {
        gameModelFacade.remove(getGameModel().getId());
        cleanData();
    }

    @Test
    public void testLanguage() {
        this.evalScript("I18nTest.testAll()");
    }

    protected String getGameModelPath() {
        return "src/main/webapp/wegas-app/db/wegas-empty-gamemodel.json";
    }
}
