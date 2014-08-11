/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013,2014 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app;

import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.rest.util.JacksonMapperProvider;
import java.io.IOException;
import javax.script.ScriptException;
import junit.framework.Assert;
import org.glassfish.embeddable.GlassFishException;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public class QuestionTest extends AbstractEmbeddedGlassfishTest {

    protected GameModel gm;
    protected Player player;

    protected String getGameModelPath(){
        return "src/main/webapp/wegas-pmg/db/wegas-pmg-gamemodel-simplePmg.json";
    }
    
    @Before
    public void setUpGM() throws IOException, GlassFishException {
        guestLogin();
        gm = this.createGameModelFromFile(this.getGameModelPath());
        player = gm.getPlayers().get(0);
    }

    @After
    public void cleanGM() {
        gmFacade.remove(gm.getId());
        gm = null;
        player = null;
    }

    protected GameModel createGameModelFromFile(String path) throws IOException {
        String pmg = TestHelper.readFile(path);
        GameModel gameModel = JacksonMapperProvider.getMapper().readValue(pmg, GameModel.class);
        //gameModel.getScriptLibrary().put("injectedScript", new GameModelContent("JavaScript", injectScript));
        System.out.println("Create game model : " + gameModel.getName());

        gmFacade.createWithDebugGame(gameModel);
        Assert.assertNotNull(gameModel.getId()); //persisted
        
        return gameModel;
    }

    @Test
    public void testNoMultipleAnswerQuestion() throws ScriptException {
    }
}
