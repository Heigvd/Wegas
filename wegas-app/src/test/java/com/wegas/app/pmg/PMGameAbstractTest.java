/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013,2014 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.pmg;

import com.wegas.app.AbstractEJBContainerTest;
import com.wegas.app.TestHelper;
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
     * @return 
     */
    protected abstract String getScriptTestPath();
    
    @Before
    public void setUpGM() throws IOException, GlassFishException {
        /* insert script from files*/
        final String script1 = SCRIPTROOT + "server-scripts/wegas-pmg-server-util.js";
        final String script2 = SCRIPTROOT + "server-scripts/wegas-pmg-server-script.js";
        final String script3 = SCRIPTROOT + "server-scripts/wegas-pmg-server-language.js";
        final String script4 = SCRIPTROOT + "server-scripts/wegas-pmg-server-simulation.js";
        final String script5 = SCRIPTROOT + "test-scripts/wegas-pmg-server-test-util.js";
        final String script6 = SCRIPTROOT + getScriptTestPath();
        
        //guestLogin();
        this.createGameModelFromFileWithScript(this.getGameModelPath(), script1, script2, script3, script4, script5, script6);
    }

    @After
    public void cleanGM() {
        gmFacade.remove(getGameModel().getId());
        cleanData();
    }
}
