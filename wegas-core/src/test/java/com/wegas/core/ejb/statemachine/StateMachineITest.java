/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.io.IOException;
import javax.naming.NamingException;
import org.junit.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class StateMachineITest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(StateMachineITest.class);

    private static final double FINAL_VALUE = 1;

    private static final String TEAM4_TOKEN = "Team4Token";

    @Test
    public void playerJoinTest() {
        this.createSecondTeam();

        NumberDescriptor testNumber;
        testNumber = new NumberDescriptor("number");
        testNumber.setDefaultInstance(new NumberInstance(0));

        NumberDescriptor testNumber2;
        testNumber2 = new NumberDescriptor("number2");
        testNumber2.setDefaultInstance(new NumberInstance(0));
        testNumber2.setScope(new GameModelScope());

        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setTriggerEvent(new Script("1===1"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, \"number\").getInstance(self).value = " + FINAL_VALUE));
        trigger.setOneShot(Boolean.TRUE);
        trigger.setDisableSelf(Boolean.FALSE);

        TriggerDescriptor countPlayer = new TriggerDescriptor();
        countPlayer.setDefaultInstance(new TriggerInstance());
        countPlayer.setTriggerEvent(new Script("1===1"));
        countPlayer.setPostTriggerEvent(new Script("Variable.find(gameModel, \"nbPlayer\").getInstance(self).value += 1;"));
        countPlayer.setOneShot(Boolean.TRUE);
        countPlayer.setDisableSelf(Boolean.FALSE);

        TriggerDescriptor trigger2 = new TriggerDescriptor();
        trigger2.setDefaultInstance(new StateMachineInstance());
        trigger2.setTriggerEvent(new Script("true"));
        trigger2.setPostTriggerEvent(new Script("Variable.find(gameModel, \"number2\").getInstance(self).value += 1 "));
        trigger2.setOneShot(Boolean.FALSE);
        trigger2.setDisableSelf(Boolean.FALSE);

        variableDescriptorFacade.create(scenario.getId(), testNumber);
        variableDescriptorFacade.create(scenario.getId(), testNumber2);
        variableDescriptorFacade.create(scenario.getId(), trigger);
        variableDescriptorFacade.create(scenario.getId(), trigger2);

        /*
         * Team: player
         * Team2: player21, player22
         */
        Team team3 = new Team("test-team3");
        Team team4 = new Team("test-team4");

        team3.setGame(game);

        team4.setGame(game);

        WegasUser user31 = this.signup("user31@local");
        login(user31);
        logger.error(" * * * *  * * * * * * * * * * * * CREATE TEAM3");
        teamFacade.create(game.getId(), team3);

        WegasUser user41 = this.signup("user41@local");
        login(user41);
        logger.error(" * * * *  * * * * * * * * * * * * CREATE TEAM4");
        teamFacade.create(game.getId(), team4);


        logger.error(" * * * *  * * * * * * * * * * * * CREATE testPlayer11");
        WegasUser user11 = this.signup("user11@local");
        login(user11);
        /*
         * Team: player, testPlayer11
         * Team2: player21, player22
         * team3:
         * team4:
         */
        Player testPlayer11 = gameFacade.joinTeam(team.getId(), "TestPlayer11", null);
        
        logger.error(" * * * *  * * * * * * * * * * * * CREATE testPlayer41");
        login(user41);
        /*
         * Team: player, testPlayer0
         * Team2: player21, player22
         * team3:
         * team4: testPlayer41
         */
        Player testPlayer41 = gameFacade.joinTeam(team4.getId(), "testPlayer41", null);

        logger.error("Players: " + testPlayer11 + " : " + testPlayer41);
        NumberDescriptor number = (NumberDescriptor) variableDescriptorFacade.find(testNumber.getId());
        /* CONTEXT? */

        login(trainer);
        Assert.assertEquals(FINAL_VALUE, number.getValue(testPlayer11), 0.0001);
        Assert.assertEquals(FINAL_VALUE, number.getValue(testPlayer41), 0.0001);

        /* REFRESH CONTEXT */
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer11)).getValue(), 0.0);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer41)).getValue(), 0.0);

        /*
         * Player created before variable -> state machines don't execute
         */
        Assert.assertEquals(1.0, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), player21)).getValue(), 0.0);
        /*
         * trigger2 is triggered 3 times, one time for each non-empty team.
         * Since we're simulation one big request, walking through the same transition twice is forbidden
         * Three non-empty teams -> number2 = 3
         */
        Assert.assertEquals(3, ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer11)).getValue(), 0.0);
        /*
         * add a player in not empty team then Reset, trigger will execute
         */
        WegasUser user42 = this.signup("user42@local");
        login(user42);
        logger.error(" * * * *  * * * * * * * * * * * * CREATE testPlayer42");
        /*
         * Team: player, testPlayer11
         * Team2: player21, player22
         * team3:
         * team4: testPlayer41, testPlayer42
         */
        Player testPlayer42 = gameFacade.joinTeam(team4.getId(), "TestPlayer42", null);

        login(trainer);
        logger.error(" * * * *  * * * * * * * * * * * * RESET");
        gameModelFacade.reset(scenario.getId());
        
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer11)).getValue(), 0.0);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer41)).getValue(), 0.0);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), player21)).getValue(), 0.0);

        /*
         * trigger2 will execute numberOfNonEmptyTeam  times after a reset -> increment testNumber2 by the same amount.
         */
        Assert.assertEquals(playerFacade.find(testPlayer11.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer11)).getValue(), 0.0);

        
        WegasUser user43 = this.signup("user43@local");
        login(user43);
        Player testPlayer43 = gameFacade.joinTeam(team4.getId(), "TestPlayer43", null);
        Assert.assertEquals(playerFacade.find(testPlayer11.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer11)).getValue(), 0.0);

        login(trainer);
        gameModelFacade.reset(scenario.getId());
        Assert.assertEquals(playerFacade.find(testPlayer11.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer11)).getValue(), 0.0);
        /*
         * Player added in empty team.
         */
        login(user31);
        Player testPlayer31 = gameFacade.joinTeam(team3.getId(), "TestPlayer31", null);
        Assert.assertEquals(playerFacade.find(testPlayer11.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer11)).getValue(), 0.0);

        login(trainer);
        gameModelFacade.reset(scenario.getId());
        Assert.assertEquals(playerFacade.find(testPlayer11.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer11)).getValue(), 0.0);
        
        WegasUser user32 = this.signup("user32@local");
        login(user32);
        Player testPlayer32 = gameFacade.joinTeam(team3.getId(), "TestPlayer32", null);

        WegasUser user33 = this.signup("user33@local");
        login(user33);
        Player testPlayer33 = gameFacade.joinTeam(team3.getId(), "TestPlayer33", null);

        WegasUser user34 = this.signup("user34@local");
        login(user34);
        Player testPlayer34 = gameFacade.joinTeam(team3.getId(), "TestPlayer34", null);

        login(trainer);
        Assert.assertEquals(playerFacade.find(testPlayer11.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer11)).getValue(), 0.0);
    }

    @Test
    public void editorUpdate() throws NamingException {
        NumberDescriptor testNumber;
        testNumber = new NumberDescriptor("numberTest");
        testNumber.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(scenario.getId(), testNumber);
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setTriggerEvent(new Script("1===1"));
        trigger.setPostTriggerEvent(new Script("print('hit');Variable.find(gameModel, \"numberTest\").setValue(self, " + FINAL_VALUE + ");"));
        trigger.setOneShot(Boolean.FALSE);
        trigger.setDisableSelf(Boolean.FALSE);
        variableDescriptorFacade.create(scenario.getId(), trigger);

        WegasUser user31 = this.signup("user31@local");
        login(user31);
        Player testPlayer = gameFacade.joinTeam(team.getId(), "TestPlayer31", null);

        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer)).getValue(), 0.0);
        NumberInstance p0Instance = (NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer);
        p0Instance.setValue(50);

        /*
         *  Simulate new request, otherwise, trigger will not be retriggered
         */
        requestManager.clearFsmData();
        requestManager.setPlayer(null);
        logger.error("CLEAR");

        variableInstanceFacade.update(p0Instance.getId(), p0Instance); // Triggers rf.commit -> StateMachine check

        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer)).getValue(), 0.0);
    }

    @Test
    public void highScore() throws NamingException, WegasScriptException {

        NumberDescriptor highScore = new NumberDescriptor("highScore");
        highScore.setDefaultInstance(new NumberInstance(0));
        highScore.setScope(new GameModelScope());

        NumberDescriptor personalScore = new NumberDescriptor("personalScore");
        personalScore.setDefaultInstance(new NumberInstance(0));
        personalScore.setScope(new PlayerScope());

        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setScope(new PlayerScope());
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setTriggerEvent(new Script("Variable.find(gameModel, 'personalScore').getInstance(self).value > Variable.find(gameModel, 'highScore').getInstance(self).value"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, 'highScore').getInstance(self).value = 10"));
        trigger.setOneShot(Boolean.FALSE);

        variableDescriptorFacade.create(scenario.getId(), trigger);
        variableDescriptorFacade.create(scenario.getId(), highScore);
        variableDescriptorFacade.create(scenario.getId(), personalScore);
        gameModelFacade.reset(scenario.getId());

        Assert.assertEquals(0, ((NumberInstance) variableInstanceFacade.find(highScore.getId(), player.getId())).getValue(), 0);
        requestFacade.setPlayer(null);

        scriptFacade.eval(player.getId(), new Script("Variable.find(gameModel, 'personalScore').getInstance(self).value = 10"), null);
        requestFacade.setPlayer(null);
        requestFacade.setPlayer(player.getId());
        requestFacade.commit();
        Assert.assertEquals(10, ((NumberInstance) variableInstanceFacade.find(personalScore.getId(), player.getId())).getValue(), 0);
        Assert.assertEquals(10, ((NumberInstance) variableInstanceFacade.find(highScore.getId(), player.getId())).getValue(), 0);
    }

    @Test
    public void testEvent() throws NamingException, NoSuchMethodException, WegasScriptException {
        final Integer ENDVAL = 5;

        // Create a number
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(scenario.getId(), number);

        // Create a trigger
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setTriggerEvent(new Script("Event.fired('testEvent')"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, " + ENDVAL + ");"));
        variableDescriptorFacade.create(scenario.getId(), trigger);

        scriptFacade.eval(player, new Script("JavaScript", "Event.on('testEvent', function(e){print('args: ' + e)});Event.fire('testEvent', " + ENDVAL + ")"), null);
        requestFacade.commit();
        Assert.assertEquals(ENDVAL, ((NumberInstance) variableInstanceFacade.find(number.getId(), player.getId())).getValue(), 0);
    }

    @Test
    public void duplicate() throws NamingException, WegasNoResultException, CloneNotSupportedException {
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setName("trigger");
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setTriggerEvent(new Script("Event.fired('testEvent')"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, param);"));
        variableDescriptorFacade.create(scenario.getId(), trigger);
        GameModel duplicateGm = gameModelFacade.createScenarioWithDebugGame(scenario.getId());
        TriggerDescriptor find = (TriggerDescriptor) variableDescriptorFacade.find(duplicateGm, "trigger");
        Assert.assertEquals(find.getStates().size(), trigger.getStates().size());
    }

    @Test
    public void disable() throws NamingException, IOException, WegasNoResultException {
        NumberDescriptor testNumber;
        testNumber = new NumberDescriptor("number");
        testNumber.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(scenario.getId(), testNumber);

        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setName("trigger");
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setTriggerEvent(new Script("true"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, 'number').setValue(self, 5);"));
        trigger.setOneShot(Boolean.FALSE);
        trigger.setDisableSelf(Boolean.TRUE);
        variableDescriptorFacade.create(scenario.getId(), trigger);
        gameModelFacade.reset(scenario.getId());
        Assert.assertEquals(5, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), player.getId())).getValue(), 0.001);

        //Set again
        requestFacade.setPlayer(null);
        NumberInstance testInstance = (NumberInstance) variableInstanceFacade.find(testNumber.getId(), player);
        testInstance.setValue(0);
        variableInstanceFacade.update(testInstance.getId(), testInstance);
        Assert.assertEquals(0, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), player.getId())).getValue(), 0.001);
    }
}
