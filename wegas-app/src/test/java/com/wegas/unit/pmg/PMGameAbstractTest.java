/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.unit.pmg;

import com.wegas.unit.AbstractEJBContainerTest;
import java.io.IOException;
import org.glassfish.embeddable.GlassFishException;
import org.junit.After;
import org.junit.Before;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
//abstract public class PMGameAbstractTest extends AbstractEmbeddedGlassfishTest {
abstract public class PMGameAbstractTest extends AbstractEJBContainerTest {

    public static final String SCRIPTROOT = "src/main/webapp/wegas-private/wegas-pmg/scripts/";

    protected abstract String getGameModelPath();

    /**
     * Return the script test path, relative to SCRIPTROOT
     *
     * @return the script test path, relative to SCRIPTROOT
     */
    protected abstract String getScriptTestPath();

    @Before
    public void setUpGM() throws IOException, GlassFishException {
        /* insert script from files*/
        String[] scripts = {
            SCRIPTROOT + "server-scripts/locales/fr.js",
            SCRIPTROOT + "server-scripts/locales/en.js",
            SCRIPTROOT + "server-scripts/wegas-pmg-server-backward.js",
            SCRIPTROOT + "server-scripts/wegas-pmg-server-event-listeners.js",
            SCRIPTROOT + "server-scripts/wegas-pmg-server-helper.js",
            SCRIPTROOT + "server-scripts/wegas-pmg-server-language.js",
            SCRIPTROOT + "server-scripts/wegas-pmg-server-simulation.js",
            SCRIPTROOT + "server-scripts/wegas-pmg-server-util.js",
            SCRIPTROOT + "test-scripts/wegas-pmg-server-test-util.js",
            SCRIPTROOT + getScriptTestPath()};

        //guestLogin();
        this.createGameModelFromFileWithScript(this.getGameModelPath(), scripts);
    }

    @After
    public void cleanGM() {
        //this.getGameModelFacade().remove(getGameModel().getId());
        cleanData();
    }
}
