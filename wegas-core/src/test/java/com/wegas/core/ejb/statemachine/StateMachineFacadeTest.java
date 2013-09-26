/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.ejb.*;
import static com.wegas.core.ejb.AbstractEJBTest.lookupBy;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import javax.naming.NamingException;
import static org.junit.Assert.assertEquals;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class StateMachineFacadeTest extends AbstractEJBTest {

    protected static final Logger logger = LoggerFactory.getLogger(StateMachineFacadeTest.class);

    /**
     * Test of entityUpdateListener method, of class StateMachineFacade.
     */
    @Test
    public void testTrigger() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final RequestFacade rm = lookupBy(RequestFacade.class);

        // rm.setPlayer(player.getId());  //uncomment to make the test fail ...

        // Create a number
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(0));
        number.setScope(new TeamScope());
        vdf.create(gameModel.getId(), number);

        // Create a trigger
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setScope(new TeamScope());
        trigger.setTriggerEvent(new Script("testnumber.value >= 0.9"));
        trigger.setPostTriggerEvent(new Script("testnumber.value = 2;"));
        vdf.create(gameModel.getId(), trigger);

        // Test initial values
        assertEquals(0.0, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);
        assertEquals(0.0, ((NumberInstance) vif.find(number.getId(), player2)).getValue(), .1);

        // Do an update
        NumberInstance numberI = (NumberInstance) vif.find(number.getId(), player);
        numberI.setValue(1);
        vif.update(numberI.getId(), numberI);

        // Test
        assertEquals(2.0, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);
        assertEquals(0.0, ((NumberInstance) vif.find(number.getId(), player2)).getValue(), .1);

        // Clean up
        vdf.remove(number.getId());
        vdf.remove(trigger.getId());
    }

    /**
     * Same as above, but with a different script
     *
     * @throws NamingException
     */
    @Test
    public void testMultipleTrigger() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final double INITIALVALUE = 5.0;
        final double INTERMEDIATEVALUE = 4.0;
        final double FINALVALUE = 3.0;

        // Create a number
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(INITIALVALUE));
        number.setScope(new TeamScope());
        vdf.create(gameModel.getId(), number);

        // Create a resource
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setScope(new TeamScope());
        trigger.setTriggerEvent(new Script("true"));
        trigger.setPostTriggerEvent(
                new Script("VariableDescriptorFacade.find(" + number.getId() + ").setValue(self, " + FINALVALUE + " )"));
        vdf.create(gameModel.getId(), trigger);

        // Do an update
        NumberInstance numberI = number.getInstance(player);
        numberI.setValue(INTERMEDIATEVALUE);
        vif.update(numberI.getId(), numberI);

        // Test
        assertEquals(FINALVALUE, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);
        assertEquals(INITIALVALUE, ((NumberInstance) vif.find(number.getId(), player2)).getValue(), .1);

        // Reset
        gameModelFacade.reset(gameModel.getId());

        // Test
        assertEquals(FINALVALUE, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);
        assertEquals(FINALVALUE, ((NumberInstance) vif.find(number.getId(), player2)).getValue(), .1);

        // Clean up
        vdf.remove(number.getId());
        vdf.remove(trigger.getId());
    }

    /**
     * Test () ->+1 (+5) ->+2 (+10)
     *
     * @throws NamingException
     */
    @Test
    public void testPassingTransitions() throws NamingException {
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final GameModelFacade gmf = lookupBy(GameModelFacade.class);
        Integer INITIALVALUE = 0;
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(INITIALVALUE));
        number.setScope(new PlayerScope());
        vdf.create(gameModel.getId(), number);

        StateMachineDescriptor sm = new StateMachineDescriptor();
        StateMachineInstance smi = new StateMachineInstance();
        smi.setCurrentStateId(1L);
        sm.setDefaultInstance(smi);
        sm.setScope(new PlayerScope());
        sm.setName("testSM");
        State state0 = new State();
        State state1 = new State();
        state1.setOnEnterEvent(new Script("testnumber.value += 5"));
        State state2 = new State();
        state2.setOnEnterEvent(new Script("testnumber.value += 10"));
        HashMap<Long, State> states = new HashMap<>();
        states.put(1L, state0);
        states.put(2L, state1);
        states.put(3L, state2);
        sm.setStates(states);
        Transition t1 = new Transition();
        t1.setPreStateImpact(new Script("testnumber.value +=1"));
        Transition t2 = new Transition();
        t2.setPreStateImpact(new Script("testnumber.value +=2"));
        List<Transition> at1 = new ArrayList<>();
        at1.add(t1);
        List<Transition> at2 = new ArrayList<>();
        at2.add(t2);
        t1.setNextStateId(2L);
        t2.setNextStateId(3L);
        state0.setTransitions(at1);
        state1.setTransitions(at2);
        vdf.create(gameModel.getId(), sm);
        gmf.reset(gameModel.getId());
        //Test for all players.
        for(Game g : gameModel.getGames()){
            for(Team t : g.getTeams()){
                for(Player p : t.getPlayers()){
                    assertEquals(INITIALVALUE + 1 + 5 + 2 + 10, ((NumberInstance) vif.find(number.getId(), p)).getValue(), .1);
                    assertEquals(3L, ((StateMachineInstance) vif.find(sm.getId(), p)).getCurrentStateId(), .1);
                }
            }
        }
        
        // Clean up
        vdf.remove(number.getId());
        vdf.remove(sm.getId());
    }
}
