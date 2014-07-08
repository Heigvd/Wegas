/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app;

import java.io.IOException;
import javax.script.ScriptException;
import org.junit.Before;
import org.junit.Test;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class PMGTest extends GameModelTest {

    private static final String SCRIPTROOT = "src/main/webapp/wegas-pmg/scripts/";

    @Test
    public void testSimplePMG() throws ScriptException {
        this.evalScript("testsimplepmg()");
    }

    @Override
    protected String getGameModelPath() {
        return "src/main/webapp/wegas-pmg/db/wegas-pmg-gamemodel-simplePmg.json";
    }

    @Before
    @Override
    public void setUpGM() throws IOException {
        /* insert script from files*/
        final String script = TestHelper.readFile(SCRIPTROOT + "wegas-pmg-server-util.js");
        final String script2 = TestHelper.readFile(SCRIPTROOT + "wegas-pmg-server-simulation.js");
        final String script3 = TestHelper.readFile(SCRIPTROOT + "wegas-pmg-serverScript.js");
        final String script4 = TestHelper.readFile(SCRIPTROOT + "wegas-pmg-server-test.js");
        gm = this.createGameModelFromFile(this.getGameModelPath(), script + "\n" + script2 + "\n" + script3 + "\n" + script4);
        player = gm.getPlayers().get(0);
    }

}
