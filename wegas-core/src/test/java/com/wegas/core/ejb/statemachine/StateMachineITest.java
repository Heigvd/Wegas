/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.ejb.AbstractEJBTest;
import static com.wegas.core.ejb.GameModelFacadeTest.lookupBy;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import javax.naming.NamingException;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class StateMachineITest extends AbstractEJBTest {

    private static TeamFacade teamFacade;
    private static PlayerFacade playerFacade;
    private static final String TEAM4_TOKEN = "Team4Token";
    private static NumberDescriptor testNumber;

    @BeforeClass
    public static void init() throws NamingException {
        teamFacade = lookupBy(TeamFacade.class);
        playerFacade = lookupBy(PlayerFacade.class);
        testNumber = new NumberDescriptor("number");
        testNumber.setDefaultInstance(new NumberInstance(0));
        testNumber.setScope(new TeamScope());
    }

    @Test
    public void PlayerJoinTest() {

        final double FINAL_VALUE = 1;

        TriggerDescriptor trigger = new TriggerDescriptor();

        trigger.setScope(new TeamScope());
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("1===1"));
        trigger.setPostTriggerEvent(new Script("number.value = " + FINAL_VALUE));
        trigger.setOneShot(Boolean.TRUE);

        descriptorFacade.create(gameModel.getId(), testNumber);
        descriptorFacade.create(gameModel.getId(), trigger);

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

        assert (FINAL_VALUE == number.getValue(testPlayer0));
        assert (FINAL_VALUE == number.getValue(testPlayer1));
    }

    @Test
    public void PlayerTeamTokenJoinTest() {

    }
}
