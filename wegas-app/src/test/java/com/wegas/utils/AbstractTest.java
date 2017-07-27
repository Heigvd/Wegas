/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.utils;

import com.wegas.core.ejb.GameModelFacade;
import com.wegas.utils.TestHelper;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.rest.ScriptController;
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.IOException;
import org.junit.Assert;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public abstract class AbstractTest {

    private static final Logger logger = LoggerFactory.getLogger(AbstractTest.class);

    private GameModel gm;
    private Player player;

    protected final void checkNumber(String name, double expectedValue) throws WegasNoResultException {
        this.checkNumber(name, expectedValue, name);
    }

    protected final void checkNumber(String name, double expectedValue, String errorMessage) throws WegasNoResultException {
        final VariableDescriptorFacade vdf = getVariableDescriptorFacade();
        Assert.assertEquals(errorMessage, expectedValue, ((NumberDescriptor) vdf.find(gm, name)).getValue(player), 0.0);
    }

    protected final void createGameModelFromFile(String gameModelPath) throws IOException {
        this.createGameModelFromFileWithScript(gameModelPath);
    }

    protected final void createGameModelWithScript(GameModel gameModel, String... injectScriptsPath) throws IOException {
        for (String injectScriptPath : injectScriptsPath) {
            String injectScript = TestHelper.readFile(injectScriptPath);

            if (injectScript == null) {
                throw WegasErrorMessage.error("Injected Script doesn't exists [" + injectScriptPath + "]");
            }
            gameModel.getScriptLibrary().add(new GameModelContent(injectScriptPath, "JavaScript", injectScript));
        }

        System.out.println("Create game model : " + gameModel.getName());
        this.getGameModelFacade().createWithDebugGame(gameModel);
        junit.framework.Assert.assertNotNull(gameModel.getId()); //persisted

        this.gm = gameModel;
        player = gm.getPlayers().get(0);
    }

    protected final void createGameModelWithConcatenatedScript(GameModel gameModel, String... injectScriptsPath) throws IOException {
        StringBuilder scriptContent = new StringBuilder("");

        for (String injectScriptPath : injectScriptsPath) {
            String injectScript = TestHelper.readFile(injectScriptPath);

            if (injectScript == null) {
                throw WegasErrorMessage.error("Injected Script doesn't exists [" + injectScriptPath + "]");
            }

            scriptContent.append(injectScript);
        }
        gameModel.getScriptLibrary().add(new GameModelContent("ConcatenatedScripts", "JavaScript", scriptContent.toString()));

        System.out.println("Create game model : " + gameModel.getName());
        this.getGameModelFacade().createWithDebugGame(gameModel);
        junit.framework.Assert.assertNotNull(gameModel.getId()); //persisted

        this.gm = gameModel;
        player = gm.getPlayers().get(0);
    }

    protected final void createGameModelFromFileWithScript(String path, String... injectScriptsPath) throws IOException {
        try {
            String pmg = TestHelper.readFile(path);
            GameModel gameModel = JacksonMapperProvider.getMapper().readValue(pmg, GameModel.class);
            this.createGameModelWithScript(gameModel, injectScriptsPath);
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Same as createGameModelFromFileWithScript but will concatenate all
     * scripts within a big one.
     * This ensure scripts will be evaluated in the given order but we'll loose
     * the filename reference...
     *
     * @param path
     * @param injectScriptsPath
     * @throws IOException
     */
    protected final void createGameModelFromFileWithConcatenatedScript(String path, String... injectScriptsPath) throws IOException {
        String pmg = TestHelper.readFile(path);
        GameModel gameModel = JacksonMapperProvider.getMapper().readValue(pmg, GameModel.class);
        this.createGameModelWithConcatenatedScript(gameModel, injectScriptsPath);
    }

    protected void cleanData() {
        this.gm = null;
        this.player = null;
    }

    protected Object evalFile(String path) {
        return this.evalScript(TestHelper.readFile(path));
    }

    protected Object evalScript(String script) {
        try {
            return getScriptController().run(gm.getId(), this.player.getId(), null, new Script(script));
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    protected abstract ScriptController getScriptController();

    protected abstract VariableDescriptorFacade getVariableDescriptorFacade();

    protected GameModel getGameModel() {
        return gm;
    }

    protected Player getPlayer() {
        return player;
    }

    protected abstract GameModelFacade getGameModelFacade();
}
