/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app;

import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.rest.LibraryController;
import javax.script.ScriptException;
import junit.framework.Assert;
import org.junit.Test;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class PMGTest extends GameModelTest {

    @Test
    public void testScript() throws ScriptException {
        /* insert script from file*/
        String script = TestHelper.readFile("src/main/webapp/wegas-pmg/scripts/wegas-pmg-serverScript.js");
        this.lookup(LibraryController.class).edit(gm.getId(), "Script", "default", new GameModelContent(script));
        Assert.assertEquals("Check valid script", script, gmFacade.find(gm.getId()).getScriptLibrary().get("default").getContent());
//        gmFacade.reset(gm.getId());
        this.runScript("nextPeriod()");
        System.out.println("currentPhase:" + this.runScript("currentPhase.value"));
    }

    @Override
    protected String getGameModelPath() {
        return "src/main/webapp/wegas-pmg/db/wegas-pmg-gamemodel.json";
    }

    private Object runScript(String script) throws ScriptException {
        return this.lookup(ScriptFacade.class).eval(this.player, new Script(script));
    }

}
