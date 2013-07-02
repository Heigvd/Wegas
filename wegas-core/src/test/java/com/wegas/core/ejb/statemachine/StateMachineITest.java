/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.GameScope;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.naming.NamingException;
import javax.script.ScriptException;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class StateMachineITest extends AbstractEJBTest {

    private static TeamFacade teamFacade;
    private static PlayerFacade playerFacade;
    private static VariableInstanceFacade instanceFacade;
    private static final double FINAL_VALUE = 1;
    private static final String TEAM4_TOKEN = "Team4Token";

    static {
        try {
            teamFacade = lookupBy(TeamFacade.class);
            playerFacade = lookupBy(PlayerFacade.class);
            instanceFacade = lookupBy(VariableInstanceFacade.class);
        } catch (NamingException ex) {
            Logger.getLogger(StateMachineITest.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    @Test
    public void PlayerJoinTest() {
        NumberDescriptor testNumber;
        testNumber = new NumberDescriptor("number");
        testNumber.setDefaultInstance(new NumberInstance(0));
        testNumber.setScope(new TeamScope());

        NumberDescriptor testNumber2;
        testNumber2 = new NumberDescriptor("number2");
        testNumber2.setDefaultInstance(new NumberInstance(0));
        testNumber2.setScope(new GameScope());

        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setScope(new TeamScope());
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("1===1"));
        trigger.setPostTriggerEvent(new Script("number.value = " + FINAL_VALUE));
        trigger.setOneShot(Boolean.TRUE);

        TriggerDescriptor trigger2 = new TriggerDescriptor();
        trigger2.setScope(new TeamScope());
        trigger2.setDefaultInstance(new TriggerInstance());
        trigger2.setTriggerEvent(new Script("true"));
        trigger2.setPostTriggerEvent(new Script("number2.value += 1 "));
        trigger2.setOneShot(Boolean.FALSE);

        descriptorFacade.create(gameModel.getId(), testNumber);
        descriptorFacade.create(gameModel.getId(), testNumber2);
        descriptorFacade.create(gameModel.getId(), trigger);
        descriptorFacade.create(gameModel.getId(), trigger2);

        Team team3 = new Team("test-team3");
        Team team4 = new Team("test-team4");

        team3.setGame(game);

        team4.setGame(game);

        team4.setToken(TEAM4_TOKEN);

        teamFacade.create(team3);

        teamFacade.create(team4);
        Player testPlayer0 = new Player("TestPlayer0");
        Player testPlayer1 = new Player("TestPlayer1");

        playerFacade.create(team.getId(), testPlayer0);
        playerFacade.create(team4.getId(), testPlayer1);


        NumberDescriptor number = (NumberDescriptor) descriptorFacade.find(testNumber.getId());
        /* CONTEXT? */
        assert FINAL_VALUE == number.getValue(testPlayer0);
        assert FINAL_VALUE == number.getValue(testPlayer1);

        /* REFRESH CONTEXT */
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) instanceFacade.find(testNumber.getId(), testPlayer0)).getValue(), 0.0);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) instanceFacade.find(testNumber.getId(), testPlayer1)).getValue(), 0.0);

        /*
         * Player created before variable -> state machines don't execute
         */
        Assert.assertEquals(0.0, ((NumberInstance) instanceFacade.find(testNumber.getId(), player2)).getValue(), 0.0);
        /*
         * Game Scope trigger increase for each player added after trigger creation
         */
        Assert.assertEquals(2, ((NumberInstance) instanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
        /*
         * add a player in not empty team then Reset, trigger will execute
         */
        playerFacade.create(team4.getId(), new Player("TestPlayer5"));
        gameModelFacade.reset(gameModel.getId());
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) instanceFacade.find(testNumber.getId(), testPlayer0)).getValue(), 0.0);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) instanceFacade.find(testNumber.getId(), testPlayer1)).getValue(), 0.0);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) instanceFacade.find(testNumber.getId(), player2)).getValue(), 0.0);

        /*
         * 5 players in 3 teams -> trigger2 will execute 5 times after a reset.
         * For each player
         */
        Assert.assertEquals(5, ((NumberInstance) instanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);

        playerFacade.create(team4.getId(), new Player("TestPlayer6"));
        Assert.assertEquals(6, ((NumberInstance) instanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
        gameModelFacade.reset(gameModel.getId());
        Assert.assertEquals(6, ((NumberInstance) instanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
        /*
         * Player added in empty team.
         */
        playerFacade.create(team3.getId(), new Player("TestPlayer7"));
        Assert.assertEquals(7, ((NumberInstance) instanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
        gameModelFacade.reset(gameModel.getId());
        Assert.assertEquals(7, ((NumberInstance) instanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
        playerFacade.create(team3.getId(), new Player("TestPlayer8"));
        playerFacade.create(team3.getId(), new Player("TestPlayer9"));
        playerFacade.create(team3.getId(), new Player("TestPlayer10"));
        Assert.assertEquals(10, ((NumberInstance) instanceFacade.find(testNumber2.getId(), testPlayer0)).getValue(), 0.0);
    }

    @Test
    public void editorUpdate() throws NamingException {
        NumberDescriptor testNumber;
        testNumber = new NumberDescriptor("numberTest");
        testNumber.setDefaultInstance(new NumberInstance(0));
        testNumber.setScope(new TeamScope());
        descriptorFacade.create(gameModel.getId(), testNumber);
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setScope(new TeamScope());
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("1===1"));
        trigger.setPostTriggerEvent(new Script("numberTest.value = " + FINAL_VALUE));
        trigger.setOneShot(Boolean.FALSE);
        descriptorFacade.create(gameModel.getId(), trigger);

        Player testPlayer = new Player("TestPlayer20");
        playerFacade.create(team.getId(), testPlayer);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) instanceFacade.find(testNumber.getId(), testPlayer)).getValue(), 0.0);
        NumberInstance p0Instance = (NumberInstance) instanceFacade.find(testNumber.getId(), testPlayer);
        p0Instance.setValue(50);
        RequestFacade rf = lookupBy(RequestFacade.class);
        rf.getRequestManager().setPlayer(null);
        instanceFacade.update(p0Instance.getId(), p0Instance);
        Assert.assertEquals(FINAL_VALUE, ((NumberInstance) instanceFacade.find(testNumber.getId(), testPlayer)).getValue(), 0.0);
    }

    @Test
    public void highScore() throws NamingException, ScriptException {

        ScriptFacade scriptFacade = lookupBy(ScriptFacade.class);
        NumberDescriptor highScore = new NumberDescriptor("highScore");
        highScore.setDefaultInstance(new NumberInstance(0));
        highScore.setScope(new GameScope());

        NumberDescriptor personalScore = new NumberDescriptor("personalScore");
        personalScore.setDefaultInstance(new NumberInstance(0));
        personalScore.setScope(new PlayerScope());

        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setScope(new PlayerScope());
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("personalScore.value > highScore.value"));
        trigger.setPostTriggerEvent(new Script("highScore.value = 10"));
        trigger.setOneShot(Boolean.FALSE);

        descriptorFacade.create(gameModel.getId(), trigger);
        descriptorFacade.create(gameModel.getId(), highScore);
        descriptorFacade.create(gameModel.getId(), personalScore);
        gameModelFacade.reset(gameModel.getId());

        Assert.assertEquals(0, ((NumberInstance) instanceFacade.find(highScore.getId(), player.getId())).getValue(), 0);
        RequestFacade rf = lookupBy(RequestFacade.class);
        rf.getRequestManager().setPlayer(null);

        scriptFacade.eval(player.getId(), new Script("personalScore.value = 10"));
        rf.getRequestManager().setPlayer(null);                                 //@TODO : THIS SHOULD NOT BE HERE
        rf.commit();
        Assert.assertEquals(10, ((NumberInstance) instanceFacade.find(personalScore.getId(), player.getId())).getValue(), 0);
        Assert.assertEquals(10, ((NumberInstance) instanceFacade.find(highScore.getId(), player.getId())).getValue(), 0);
    }
}
