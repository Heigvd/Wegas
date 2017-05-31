/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.test.AbstractEJBTest;
import com.wegas.core.ejb.*;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import org.junit.Assert;
import org.junit.Test;

import javax.naming.NamingException;
import java.io.IOException;
import java.sql.SQLException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class StateMachineITest extends AbstractEJBTest {

    private static final Logger logger = LoggerFactory.getLogger(StateMachineITest.class);

    private static final double FINAL_VALUE = 1;

    private static final String TEAM4_TOKEN = "Team4Token";

    @Test
    public void PlayerJoinTest() {
        NumberDescriptor testNumber;
        testNumber = new NumberDescriptor("number");
        testNumber.setDefaultInstance(new NumberInstance(0));

        NumberDescriptor testNumber2;
        testNumber2 = new NumberDescriptor("number2");
        testNumber2.setDefaultInstance(new NumberInstance(0));
        testNumber2.setScope(new GameScope());

        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("1===1"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, \"number\").getInstance(self).value = " + FINAL_VALUE));
        trigger.setOneShot(Boolean.TRUE);
        trigger.setDisableSelf(Boolean.FALSE);

        TriggerDescriptor trigger2 = new TriggerDescriptor();
        trigger2.setDefaultInstance(new TriggerInstance());
        trigger2.setTriggerEvent(new Script("true"));
        trigger2.setPostTriggerEvent(new Script("Variable.find(gameModel, \"number2\").getInstance(self).value += 1 "));
        trigger2.setOneShot(Boolean.FALSE);
        trigger2.setDisableSelf(Boolean.FALSE);

        variableDescriptorFacade.create(scenario.getId(), testNumber);
        variableDescriptorFacade.create(scenario.getId(), testNumber2);
        variableDescriptorFacade.create(scenario.getId(), trigger);
        variableDescriptorFacade.create(scenario.getId(), trigger2);

        Team team3 = new Team("test-team3");
        Team team4 = new Team("test-team4");

        team3.setGame(game);

        team4.setGame(game);

        teamFacade.create(game.getId(), team3);
        teamFacade.create(game.getId(), team4);

        Player testPlayer0 = new Player("TestPlayer0");
        Player testPlayer1 = new Player("TestPlayer1");

        playerFacade.create(team.getId(), testPlayer0);
        playerFacade.create(team4.getId(), testPlayer1);

        NumberDescriptor number = (NumberDescriptor) variableDescriptorFacade.find(testNumber.getId());
        /* CONTEXT? */
        assert FINAL_VALUE == number.getValue(testPlayer0);
        assert FINAL_VALUE == number.getValue(testPlayer1);

        /* REFRESH CONTEXT */
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer0)).getValue(), 0.0);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer1)).getValue(), 0.0);

        /*
         * Player created before variable -> state machines don't execute
         */
        Assert.assertEquals(0.0, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), player2)).getValue(), 0.0);
        /*
         * Game Scope trigger increase for each player added after trigger creation
         */
        Assert.assertEquals(2, ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
        /*
         * add a player in not empty team then Reset, trigger will execute
         */
        playerFacade.create(team4.getId(), new Player("TestPlayer5"));
        gameModelFacade.reset(scenario.getId());
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer0)).getValue(), 0.0);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer1)).getValue(), 0.0);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), player2)).getValue(), 0.0);

        /*
         * trigger2 will execute numberOfPlayers times after a reset -> increment testNumber2 by the same amount.
         * For each player
         */
        Assert.assertEquals(playerFacade.find(testPlayer0.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);

        playerFacade.create(team4.getId(), new Player("TestPlayer6"));
        Assert.assertEquals(playerFacade.find(testPlayer0.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
        gameModelFacade.reset(scenario.getId());
        Assert.assertEquals(playerFacade.find(testPlayer0.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
        /*
         * Player added in empty team.
         */
        playerFacade.create(team3.getId(), new Player("TestPlayer7"));
        Assert.assertEquals(playerFacade.find(testPlayer0.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
        gameModelFacade.reset(scenario.getId());
        Assert.assertEquals(playerFacade.find(testPlayer0.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
        playerFacade.create(team3.getId(), new Player("TestPlayer8"));
        playerFacade.create(team3.getId(), new Player("TestPlayer9"));
        playerFacade.create(team3.getId(), new Player("TestPlayer10"));
        Assert.assertEquals(playerFacade.find(testPlayer0.getId()).getGame().getPlayers().size(), ((NumberInstance) variableInstanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
    }

    @Test
    public void editorUpdate() throws NamingException {
        NumberDescriptor testNumber;
        testNumber = new NumberDescriptor("numberTest");
        testNumber.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(scenario.getId(), testNumber);
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("1===1"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, \"numberTest\").setValue(self, " + FINAL_VALUE + ");"));
        trigger.setOneShot(Boolean.FALSE);
        trigger.setDisableSelf(Boolean.FALSE);
        variableDescriptorFacade.create(scenario.getId(), trigger);

        Player testPlayer = new Player("TestPlayer20");
        playerFacade.create(team.getId(), testPlayer);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer)).getValue(), 0.0);
        NumberInstance p0Instance = (NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer);
        p0Instance.setValue(50);
        requestManager.setPlayer(null);
        variableInstanceFacade.update(p0Instance.getId(), p0Instance); // Triggers rf.commit -> StateMachine check

        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), testPlayer)).getValue(), 0.0);
    }

    @Test
    public void highScore() throws NamingException, WegasScriptException {

        NumberDescriptor highScore = new NumberDescriptor("highScore");
        highScore.setDefaultInstance(new NumberInstance(0));
        highScore.setScope(new GameScope());

        NumberDescriptor personalScore = new NumberDescriptor("personalScore");
        personalScore.setDefaultInstance(new NumberInstance(0));
        personalScore.setScope(new PlayerScope());

        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setScope(new PlayerScope());
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("Variable.find(gameModel, 'personalScore').getInstance(self).value > Variable.find(gameModel, 'highScore').getInstance(self).value"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, 'highScore').getInstance(self).value = 10"));
        trigger.setOneShot(Boolean.FALSE);

        variableDescriptorFacade.create(scenario.getId(), trigger);
        variableDescriptorFacade.create(scenario.getId(), highScore);
        variableDescriptorFacade.create(scenario.getId(), personalScore);
        gameModelFacade.reset(scenario.getId());

        Assert.assertEquals(0, ((NumberInstance) variableInstanceFacade.find(highScore.getId(), player.getId())).getValue(), 0);
        requestManager.setPlayer(null);

        scriptFacade.eval(player.getId(), new Script("Variable.find(gameModel, 'personalScore').getInstance(self).value = 10"), null);
        requestManager.setPlayer(null);
        requestManager.setPlayer(player);
        requestFacade.commit(true);
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
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("Event.fired('testEvent')"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, " + ENDVAL + ");"));
        variableDescriptorFacade.create(scenario.getId(), trigger);

        scriptFacade.eval(player, new Script("JavaScript", "Event.on('testEvent', function(e){print('args: ' + e)});Event.fire('testEvent', " + ENDVAL + ")"), null);
        requestFacade.commit(true);
        Assert.assertEquals(ENDVAL, ((NumberInstance) variableInstanceFacade.find(number.getId(), player.getId())).getValue(), 0);
    }

    @Test
    public void duplicate() throws NamingException, IOException, WegasNoResultException {
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setName("trigger");
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("Event.fired('testEvent')"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, param);"));
        variableDescriptorFacade.create(scenario.getId(), trigger);
        GameModel duplicateGm = gameModelFacade.duplicateWithDebugGame(scenario.getId());
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
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("true"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, 'number').setValue(self, 5);"));
        trigger.setOneShot(Boolean.FALSE);
        trigger.setDisableSelf(Boolean.TRUE);
        variableDescriptorFacade.create(scenario.getId(), trigger);
        gameModelFacade.reset(scenario.getId());
        Assert.assertEquals(5, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), player.getId())).getValue(), 0.001);

        //Set again
        requestManager.setPlayer(null);
        NumberInstance testInstance = (NumberInstance) variableInstanceFacade.find(testNumber.getId(), player);
        testInstance.setValue(0);
        variableInstanceFacade.update(testInstance.getId(), testInstance);
        Assert.assertEquals(0, ((NumberInstance) variableInstanceFacade.find(testNumber.getId(), player.getId())).getValue(), 0.001);

    }

    public void testChose() throws NamingException, NoSuchMethodException, IOException, WegasNoResultException, SQLException {
        this.testEvent();

        this.reseAndSetUpDB();

        this.editorUpdate();

        this.reseAndSetUpDB();

        this.highScore();

        this.reseAndSetUpDB();

        this.duplicate();

        this.reseAndSetUpDB();

        this.disable();
    }
}
