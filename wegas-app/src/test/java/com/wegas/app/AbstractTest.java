/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
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
import org.junit.Assert;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */


public abstract class AbstractTest {

    private GameModel gm;
    private Player player;

    protected final void checkNumber(String name, double expectedValue) {
        this.checkNumber(name, expectedValue, name);
    }

    protected final void checkNumber(String name, double expectedValue, String errorMessage) {
        final VariableDescriptorFacade vdf = getVariableDescriptorFacade();
        Assert.assertEquals(errorMessage, expectedValue, ((NumberDescriptor) vdf.find(gm, name)).getValue(player), 0.0);
    }

    protected final void createGameModelFromFile(String gameModelPath) throws IOException {
        this.createGameModelFromFile(gameModelPath, "");
    }

    protected final void createGameModelFromFile(String path, String injectScript) throws IOException {
        String pmg = TestHelper.readFile(path);
        GameModel gameModel = JacksonMapperProvider.getMapper().readValue(pmg, GameModel.class);
        gameModel.getScriptLibrary().put("injectedScript", new GameModelContent("JavaScript", injectScript));
        System.out.println("Create game model : " + gameModel.getName());
        AbstractEJBContainerTest.gmFacade.createWithDebugGame(gameModel);
        junit.framework.Assert.assertNotNull(gameModel.getId()); //persisted
        
        this.gm = gameModel;
        player = gm.getPlayers().get(0);
    }

    protected void cleanData() {
        this.gm = null;
        this.player = null;
    }


    protected Object evalFile(String path) throws ScriptException {
        return this.evalScript(TestHelper.readFile(path));
    }

    protected Object evalScript(String script) throws ScriptException
    {
        return getScriptController().run(gm.getId(), this.player.getId(), new Script(script));
    }

    protected abstract ScriptController getScriptController();
    protected abstract VariableDescriptorFacade getVariableDescriptorFacade();
    
    protected GameModel getGameModel(){
        return gm;
    }

    protected Player getPlayer(){
        return player;
    }
}
