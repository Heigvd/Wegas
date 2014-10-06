/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.unit.pmg;

import javax.script.ScriptException;
import org.junit.Test;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public class ArtosTest extends PMGameAbstractTest {

    @Test
    public void testArtos() throws ScriptException {
        //this.evalScript("testArtos()");
        this.evalScript("testMessages()");
    }

    @Override
    protected String getGameModelPath() {
        return "src/main/webapp/wegas-pmg/db/wegas-pmg-gamemodel-Artos.json";
    }

    @Override
    protected String getScriptTestPath() {
        return "test-scripts/wegas-pmg-server-test-artos.js";
    }

}
