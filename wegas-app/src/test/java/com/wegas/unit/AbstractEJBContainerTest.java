/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.unit;

import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.GameModelContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.test.AbstractEJBTestBase;
import com.wegas.utils.TestHelper;
import java.io.IOException;

import javax.ejb.embeddable.EJBContainer;
import javax.naming.NamingException;
import org.junit.Assert;
import org.junit.BeforeClass;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public abstract class AbstractEJBContainerTest extends AbstractEJBTestBase {

    private static EJBContainer container;

    protected GameModel gameModel;
    protected Player player;

    @BeforeClass
    public static void setUpClass() throws NamingException {
        AbstractEJBTestBase.setUpFacades("../wegas-core/");
    }

    protected <T> T lookup(Class<T> className) {
        try {
            return Helper.lookupBy(container.getContext(), className, className);
        } catch (NamingException ex) {
            return null;
        }
    }

    protected final void checkNumber(String name, double expectedValue) throws WegasNoResultException {
        this.checkNumber(name, expectedValue, name);
    }

    protected final void checkNumber(String name, double expectedValue, String errorMessage) throws WegasNoResultException {
        Assert.assertEquals(errorMessage, expectedValue, ((NumberDescriptor) variableDescriptorFacade.find(getGameModel(), name)).getValue(player), 0.0);
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
        gameModelFacade.createWithDebugGame(gameModel);
        Assert.assertNotNull(gameModel.getId()); //persisted

        this.gameModel = gameModel;
        player = this.getGameModel().getPlayers().get(0);
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
        gameModel.getScriptLibrary().add(new GameModelContent("concatenatedScripts", "JavaScript", scriptContent.toString()));

        System.out.println("Create game model : " + gameModel.getName());
        gameModelFacade.createWithDebugGame(gameModel);
        Assert.assertNotNull(gameModel.getId()); //persisted

        this.gameModel = gameModel;
        player = this.gameModel.getPlayers().get(0);
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
     *
     * @throws IOException
     */
    protected final void createGameModelFromFileWithConcatenatedScript(String path, String... injectScriptsPath) throws IOException {
        String pmg = TestHelper.readFile(path);
        GameModel gameModel = JacksonMapperProvider.getMapper().readValue(pmg, GameModel.class);
        this.createGameModelWithConcatenatedScript(gameModel, injectScriptsPath);
    }

    protected void cleanData() {
        this.gameModel = null;
        this.player = null;
    }

    protected Object evalFile(String path) {
        return this.evalScript(TestHelper.readFile(path));
    }

    protected Object evalScript(String script) {
        try {
            return scriptController.run(getGameModel().getId(), this.player.getId(), null, new Script(script));
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    protected GameModel getGameModel() {
        return gameModel;
    }

    protected Player getPlayer() {
        return player;
    }
}
