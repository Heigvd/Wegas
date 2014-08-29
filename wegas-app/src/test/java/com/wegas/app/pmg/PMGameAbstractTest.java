/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013,2014 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pmg;

import com.wegas.app.AbstractEJBContainerTest;
import java.io.IOException;
import org.glassfish.embeddable.GlassFishException;
import org.junit.After;
import org.junit.Before;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
//abstract public class PMGameAbstractTest extends AbstractEmbeddedGlassfishTest {
abstract public class PMGameAbstractTest extends AbstractEJBContainerTest {

    public static final String SCRIPTROOT = "src/main/webapp/wegas-pmg/scripts/";

    protected abstract String getGameModelPath();

    /**
     * Return the script test path, relative to SCRIPTROOT
     *
     * @return
     */
    protected abstract String getScriptTestPath();

    @Before
    public void setUpGM() throws IOException, GlassFishException {
        /* insert script from files*/
        String[] scripts = {
            SCRIPTROOT + "server-scripts/wegas-pmg-server-util.js",
            SCRIPTROOT + "server-scripts/wegas-pmg-server-script.js",
            SCRIPTROOT + "server-scripts/wegas-pmg-server-simulation.js",
            SCRIPTROOT + "server-scripts/locales/fr.js",
            SCRIPTROOT + "server-scripts/locales/en.js",
            SCRIPTROOT + "server-scripts/wegas-pmg-server-language.js",
            SCRIPTROOT + "test-scripts/wegas-pmg-server-test-util.js",
            SCRIPTROOT + getScriptTestPath()};

        //guestLogin();
        this.createGameModelFromFileWithScript(this.getGameModelPath(), scripts);
    }

    @After
    public void cleanGM() {
        gmFacade.remove(getGameModel().getId());
        cleanData();
    }
}
