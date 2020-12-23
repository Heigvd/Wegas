/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.unit.pmg;

import com.wegas.core.Helper;
import com.wegas.utils.AbstractTest;
import java.io.IOException;
import java.nio.file.Paths;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
//abstract public class PMGameAbstractTest extends AbstractEmbeddedGlassfishTest {
abstract public class PMGameAbstractTest extends AbstractTest {

    public static final String SCRIPTROOT = "src/main/webapp/wegas-private/wegas-pmg/scripts/";
    public static final String APP_SCRIPTROOT = "src/main/webapp/wegas-app/js/server/";
    private static final Logger logger = LoggerFactory.getLogger(PMGameAbstractTest.class);

    protected abstract String getGameModelPath();

    /**
     * Return the script test path, relative to SCRIPTROOT
     s*
     * @return the script test path, relative to SCRIPTROOT
     */
    protected abstract String getScriptTestPath();

    @BeforeEach
    public void setUpGM() throws IOException {
        /* insert script from files*/
        //Helper.setWegasRootDirectory(Paths.get("").toAbsolutePath() + "/src/main/webapp/");
        Helper.setWegasRootDirectory(Paths.get("src/main/webapp").toUri().toString());

        String[] scripts = {
            //APP_SCRIPTROOT + "/wegas-server-helper.js",
            //APP_SCRIPTROOT + "/i18n/wegas-server-i18n.js",
            //APP_SCRIPTROOT + "/i18n/locales/fr.js",
            //APP_SCRIPTROOT + "/i18n/locales/en.js",
            //SCRIPTROOT + "server-scripts/locales/fr.js",
            //SCRIPTROOT + "server-scripts/locales/en.js",
            //SCRIPTROOT + "server-scripts/wegas-pmg-server-backward.js",
            //SCRIPTROOT + "server-scripts/wegas-pmg-server-event-listeners.js",
            //SCRIPTROOT + "server-scripts/wegas-pmg-server-helper.js",
            //SCRIPTROOT + "server-scripts/wegas-pmg-server-simulation.js",
            //SCRIPTROOT + "server-scripts/wegas-pmg-server-util.js",
            SCRIPTROOT + "test-scripts/wegas-pmg-server-test-util.js",
            SCRIPTROOT + getScriptTestPath()};

        //guestLogin();
        this.createGameModelFromFileWithScript(this.getGameModelPath(), scripts);
        this.initTime = System.currentTimeMillis();
        requestManager.clearEntities();
    }

    @AfterEach
    public void cleanGM() {
        //this.getGameModelFacade().remove(getGameModel().getId());
        cleanData();
    }
}
