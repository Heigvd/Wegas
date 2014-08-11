/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013,2014 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.rest.ScriptController;
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.IOException;
import javax.script.ScriptException;
import junit.framework.Assert;
import org.glassfish.embeddable.GlassFishException;
import org.junit.After;
import org.junit.Before;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
abstract public class PMGameAbstractTest extends AbstractEmbeddedGlassfishTest {

    public static final String SCRIPTROOT = "src/main/webapp/wegas-pmg/scripts/";

    protected GameModel gm;
    protected Player player;

    protected abstract String getGameModelPath();
    
    /**
     * Return the script test path, relative to SCRIPTROOT
     * @return 
     */
    protected abstract String getScriptTestPath();
    
    @Before
    public void setUpGM() throws IOException, GlassFishException {
        /* insert script from files*/
        final String script = TestHelper.readFile(SCRIPTROOT + "wegas-pmg-server-util.js");
        final String script2 = TestHelper.readFile(SCRIPTROOT + "wegas-pmg-server-simulation.js");
        final String script3 = TestHelper.readFile(SCRIPTROOT + "wegas-pmg-serverScript.js");
        final String script4 = TestHelper.readFile(SCRIPTROOT + "wegas-pmg-server-test-util.js");
        final String script5 = TestHelper.readFile(SCRIPTROOT + getScriptTestPath());

        guestLogin();
        gm = this.createGameModelFromFile(this.getGameModelPath(), script + "\n" + script2 + "\n" + script3 + "\n" + script4 + "\n" + script5);
        player = gm.getPlayers().get(0);
    }


    @After
    public void cleanGM() {
        gmFacade.remove(gm.getId());
        gm = null;
        player = null;
    }

    protected GameModel createGameModelFromFile(String gameModelPath) throws IOException {
        return this.createGameModelFromFile(gameModelPath, "");
    }

    protected GameModel createGameModelFromFile(String path, String injectScript) throws IOException {
        String pmg = TestHelper.readFile(path);
        GameModel gameModel = JacksonMapperProvider.getMapper().readValue(pmg, GameModel.class);
        gameModel.getScriptLibrary().put("injectedScript", new GameModelContent("JavaScript", injectScript));
        System.out.println("Create game model : " + gameModel.getName());

        gmFacade.createWithDebugGame(gameModel);
        Assert.assertNotNull(gameModel.getId()); //persisted
        
        return gameModel;
    }

    protected Object evalScript(String script) throws ScriptException {
        return AbstractEmbeddedGlassfishTest.lookup(ScriptController.class).run(gm.getId(), this.player.getId(), new Script(script));
    }

    protected Object evalFile(String path) throws ScriptException {
        return this.evalScript(TestHelper.readFile(path));
    }

    protected final void checkNumber(String name, double expectedValue, String errorMessage) {
        final VariableDescriptorFacade vdf = lookup(VariableDescriptorFacade.class);
        org.junit.Assert.assertEquals(errorMessage, expectedValue, ((NumberDescriptor) vdf.find(gm, name)).getValue(player), 0.0);
    }

    protected final void checkNumber(String name, double expectedValue) {
        this.checkNumber(name, expectedValue, name);
    }
}
