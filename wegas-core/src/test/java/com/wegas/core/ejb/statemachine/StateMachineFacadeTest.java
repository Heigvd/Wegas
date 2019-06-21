/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.statemachine.*;
import static com.wegas.test.TestHelper.toList;
import static com.wegas.test.TestHelper.toMap;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.EJB;
import javax.naming.NamingException;
import static org.junit.Assert.assertEquals;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class StateMachineFacadeTest extends AbstractArquillianTest {

    @EJB
    private StateMachineFacade stateMachineFacade;

    protected static final Logger logger = LoggerFactory.getLogger(StateMachineFacadeTest.class);

    /**
     * Test of entityUpdateListener method, of class StateMachineFacade.
     *
     * @throws javax.naming.NamingException
     */
    @Test
    public void testTrigger() throws NamingException {
        this.createSecondTeam();
        // rm.setPlayer(player.getId());  //uncomment to make the test fail ...
        // Create a number
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(0));
        variableDescriptorFacade.create(scenario.getId(), number);

        // Create a trigger
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setTriggerEvent(new Script("Variable.find(gameModel, \"testnumber\").getValue(self) >= 0.9"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, \"testnumber\").setValue(self, 2);"));
        variableDescriptorFacade.create(scenario.getId(), trigger);

        // Test initial values
        assertEquals(0.0, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);
        assertEquals(0.0, ((NumberInstance) variableInstanceFacade.find(number.getId(), player21)).getValue(), .1);

        // Do an update
        NumberInstance numberI = (NumberInstance) variableInstanceFacade.find(number.getId(), player);
        numberI.setValue(1);
        variableInstanceFacade.update(numberI.getId(), numberI);

        // Test
        assertEquals(2.0, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);
        assertEquals(0.0, ((NumberInstance) variableInstanceFacade.find(number.getId(), player21)).getValue(), .1);

        // Clean up
        variableDescriptorFacade.remove(number.getId());
        variableDescriptorFacade.remove(trigger.getId());
    }

    /**
     * Same as above, but with a different script
     *
     * @throws NamingException
     */
    @Test
    public void testMultipleTrigger() throws NamingException {
        this.createSecondTeam();
        final double INITIALVALUE = 5.0;
        final double INTERMEDIATEVALUE = 4.0;
        final double FINALVALUE = 3.0;

        // Create a number
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(INITIALVALUE));
        variableDescriptorFacade.create(scenario.getId(), number);

        // Create a resource
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setTriggerEvent(new Script("true"));
        trigger.setPostTriggerEvent(
                new Script("Variable.find(" + number.getId() + ").setValue(self, " + FINALVALUE + " )"));
        variableDescriptorFacade.create(scenario.getId(), trigger);

        // Do an update
        NumberInstance numberI = number.getInstance(player);
        numberI.setValue(INTERMEDIATEVALUE);
        variableInstanceFacade.update(numberI.getId(), numberI);

        // Test
        assertEquals(FINALVALUE, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);
        assertEquals(INITIALVALUE, ((NumberInstance) variableInstanceFacade.find(number.getId(), player21)).getValue(), .1);

        // Reset
        gameModelFacade.reset(scenario.getId());

        // Test
        assertEquals(FINALVALUE, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);
        assertEquals(FINALVALUE, ((NumberInstance) variableInstanceFacade.find(number.getId(), player21)).getValue(), .1);

        // Clean up
        variableDescriptorFacade.remove(number.getId());
        variableDescriptorFacade.remove(trigger.getId());
    }

    /**
     * Test () ->+1 (+5) ->+2 (+10)
     *
     * @throws NamingException
     */
    @Test
    public void testPassingTransitions() throws NamingException {
        this.createSecondTeam();
        Integer INITIALVALUE = 0;
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(INITIALVALUE));
        number.setScope(new PlayerScope());
        variableDescriptorFacade.create(scenario.getId(), number);

        StateMachineDescriptor sm = new StateMachineDescriptor();
        StateMachineInstance smi = new StateMachineInstance();
        smi.setCurrentStateId(1L);
        sm.setDefaultInstance(smi);
        sm.setScope(new PlayerScope());
        sm.setName("testSM");
        State state0 = new State();
        State state1 = new State();
        state1.setOnEnterEvent(new Script("Variable.find(gameModel, \"testnumber\").add(self, 5);"));
        State state2 = new State();
        state2.setOnEnterEvent(new Script("Variable.find(gameModel, \"testnumber\").add(self, 10);"));
        sm.setStates(toMap(toList(1L, 2L, 3L), toList(state0, state1, state2)));
        Transition t1 = new Transition();
        t1.setPreStateImpact(new Script("Variable.find(gameModel, \"testnumber\").add(self, 1);"));
        Transition t2 = new Transition();
        t2.setPreStateImpact(new Script("Variable.find(gameModel, \"testnumber\").add(self, 2)"));

        t1.setNextStateId(2L);
        t2.setNextStateId(3L);
        state0.setTransitions(toList(t1));
        state1.setTransitions(toList(t2));
        variableDescriptorFacade.create(scenario.getId(), sm);
        gameModelFacade.reset(scenario.getId());
        //Test for all players.
        for (Game g : scenario.getGames()) {
            for (Team t : g.getTeams()) {
                for (Player p : t.getPlayers()) {
                    assertEquals(INITIALVALUE + 1 + 5 + 2 + 10, ((NumberInstance) variableInstanceFacade.find(number.getId(), p)).getValue(), .1);
                    assertEquals(3L, ((StateMachineInstance) variableInstanceFacade.find(sm.getId(), p)).getCurrentStateId(), .1);
                }
            }
        }

        // Clean up
        variableDescriptorFacade.remove(number.getId());
        variableDescriptorFacade.remove(sm.getId());
    }

    @Test
    public void testDialogue() throws NamingException {
        DialogueDescriptor dial = new DialogueDescriptor();
        dial.setName("dial");
        StateMachineInstance dialI = new StateMachineInstance();
        dialI.setCurrentStateId(1L);
        dial.setDefaultInstance(dialI);
        dial.setScope(new PlayerScope());

        DialogueState ds1 = new DialogueState();
        DialogueState ds2 = new DialogueState();
        ds1.setText(TranslatableContent.build("en", "Hello"));
        ds2.setText(TranslatableContent.build("en", "World"));
        dial.setStates(toMap(toList(1L, 2L), toList(ds1, ds2)));

        DialogueTransition s1ToS2 = new DialogueTransition();
        s1ToS2.setNextStateId(2L);
        s1ToS2.setActionText(TranslatableContent.build("en", ", "));
        ds1.setTransitions(toList(s1ToS2));
        variableDescriptorFacade.create(scenario.getId(), dial);
        gameModelFacade.reset(scenario.getId());
        assertEquals("Hello", (((DialogueState) ((StateMachineInstance) variableInstanceFacade.find(dial.getId(), player.getId())).getCurrentState()).getText().translateOrEmpty(player)));
        stateMachineFacade.doTransition(scenario.getId(), player.getId(), dial.getId(), s1ToS2.getId());
        assertEquals("World", (((DialogueState) ((StateMachineInstance) variableInstanceFacade.find(dial.getId(), player.getId())).getCurrentState()).getText().translateOrEmpty(player)));
    }

    @Test
    public void testEventTransition() throws NamingException, WegasScriptException {
        this.createSecondTeam();
        Integer INITIALVALUE = 0;
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(INITIALVALUE));
        number.setScope(new PlayerScope());
        variableDescriptorFacade.create(scenario.getId(), number);

        StateMachineDescriptor sm = new StateMachineDescriptor();
        StateMachineInstance smi = new StateMachineInstance();
        smi.setCurrentStateId(1L);
        sm.setDefaultInstance(smi);
        sm.setScope(new PlayerScope());
        sm.setName("testSM");
        State state0 = new State();
        State state1 = new State();
        state1.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').add(self, 5)"));
        State state2 = new State();
        //Second state will read an object parameter
        state2.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, Variable.find(gameModel, 'testnumber').getValue(self) + 10)"));
        sm.setStates(toMap(toList(1L, 2L, 3L), toList(state0, state1, state2)));

        Transition t1 = new Transition();
        t1.setTriggerCondition(new Script("Event.fired('event')"));
        t1.setNextStateId(2L);
        state0.setTransitions(toList(t1));

        Transition t2 = new Transition();
        t2.setTriggerCondition(new Script("Event.fired('event')"));
        t2.setNextStateId(3L);
        List<Transition> at2 = new ArrayList<>();
        at2.add(t2);
        state1.setTransitions(at2);

        variableDescriptorFacade.create(scenario.getId(), sm);
        gameModelFacade.reset(scenario.getId());
        //Test for all players, nothing should change.
        for (Game g : scenario.getGames()) {
            for (Team t : g.getTeams()) {
                for (Player p : t.getPlayers()) {
                    assertEquals(INITIALVALUE, ((NumberInstance) variableInstanceFacade.find(number.getId(), p)).getValue(), .1);
                    assertEquals(1L, ((StateMachineInstance) variableInstanceFacade.find(sm.getId(), p)).getCurrentStateId(), .1);
                }
            }
        }

        /* player fire event twice */
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event');Event.fire('event')"), null);
        requestFacade.commit();
        assertEquals(INITIALVALUE + 5 + 10, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        /* player22 fire event only once */
        scriptFacade.eval(player22, new Script("JavaScript", "Event.fire('event');"), null);
        requestFacade.commit();
        assertEquals(INITIALVALUE + 5, ((NumberInstance) variableInstanceFacade.find(number.getId(), player22)).getValue(), .1);
        // Clean up
        variableDescriptorFacade.remove(number.getId());
        variableDescriptorFacade.remove(sm.getId());
    }

    @Test
    public void testMultipleEventTransition_oneEvent() throws NamingException, WegasScriptException {
        Integer INITIALVALUE = 0;
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(INITIALVALUE));
        number.setScope(new PlayerScope());
        variableDescriptorFacade.create(scenario.getId(), number);

        StateMachineDescriptor sm = new StateMachineDescriptor();
        StateMachineInstance smi = new StateMachineInstance();
        smi.setCurrentStateId(1L);
        sm.setDefaultInstance(smi);
        sm.setScope(new PlayerScope());
        sm.setName("testSM");
        State state0 = new State();
        State state1 = new State();
        state1.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').add(self, 1);"));
        State state2 = new State();
        //Second state will read an object parameter
        state2.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, Variable.find(gameModel, 'testnumber').getValue(self) + 10)"));
        sm.setStates(toMap(toList(1L, 2L, 3L), toList(state0, state1, state2)));

        Transition t1 = new Transition();
        t1.setTriggerCondition(new Script("Event.fired('event') && Event.fired('event')"));
        t1.setNextStateId(2L);
        state0.setTransitions(toList(t1));

        Transition t2 = new Transition();
        t2.setTriggerCondition(new Script("Event.fired('event')"));
        t2.setNextStateId(3L);
        List<Transition> at2 = new ArrayList<>();
        at2.add(t2);
        state1.setTransitions(at2);

        variableDescriptorFacade.create(scenario.getId(), sm);
        gameModelFacade.reset(scenario.getId());
        //Test for all players, nothing should change.
        for (Game g : scenario.getGames()) {
            for (Team t : g.getTeams()) {
                for (Player p : t.getPlayers()) {
                    assertEquals(INITIALVALUE, ((NumberInstance) variableInstanceFacade.find(number.getId(), p)).getValue(), .1);
                    assertEquals(1L, ((StateMachineInstance) variableInstanceFacade.find(sm.getId(), p)).getCurrentStateId(), .1);
                }
            }
        }

        /* player fire event  -> NO MOVE */
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event');"), null);
        requestFacade.commit();
        assertEquals(0, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        gameModelFacade.reset(scenario.getId());
        requestFacade.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 */
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event');Event.fire('event');"), null);
        requestFacade.commit();
        assertEquals(1, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        gameModelFacade.reset(scenario.getId());
        requestFacade.getRequestManager().getEventCounter().clear();
        /* player fire event twice and event2 */
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event'); Event.fire('event'); Event.fire('event');"), null);
        requestFacade.commit();
        assertEquals(11, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        // Clean up
        variableDescriptorFacade.remove(number.getId());
        variableDescriptorFacade.remove(sm.getId());
    }

    @Test
    public void testMultipleEventTransition_twoEvents() throws NamingException, WegasScriptException {
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(0));
        number.setScope(new PlayerScope());
        variableDescriptorFacade.create(scenario.getId(), number);

        StateMachineDescriptor sm = new StateMachineDescriptor();
        StateMachineInstance smi = new StateMachineInstance();
        smi.setCurrentStateId(1L);
        sm.setDefaultInstance(smi);
        sm.setScope(new PlayerScope());
        sm.setName("testSM");

        State state1 = new State();

        State state2 = new State();
        state2.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').add(self, 1)"));

        State state3 = new State();
        state3.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').add(self, 10)"));

        State state4 = new State();
        state4.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').add(self, 100)"));

        sm.setStates(toMap(toList(1L, 2L, 3L, 4L), toList(state1, state2, state3, state4)));

        Transition t1 = new Transition();
        t1.setTriggerCondition(new Script("Event.fired('event') && Event.fired('event2')"));
        t1.setNextStateId(2L);
        state1.setTransitions(toList(t1));

        Transition t2 = new Transition();
        t2.setTriggerCondition(new Script("Event.fired('event')"));
        t2.setIndex(1);
        t2.setNextStateId(3L);

        Transition t3 = new Transition();
        t3.setTriggerCondition(new Script("Event.fired('event2')"));
        t2.setIndex(99);
        t3.setNextStateId(4L);

        state2.setTransitions(toList(t2, t3));

        variableDescriptorFacade.create(scenario.getId(), sm);
        gameModelFacade.reset(scenario.getId());
        //Test for all players, nothing should change.
        for (Game g : scenario.getGames()) {
            for (Team t : g.getTeams()) {
                for (Player p : t.getPlayers()) {
                    assertEquals(0, ((NumberInstance) variableInstanceFacade.find(number.getId(), p)).getValue(), .1);
                    assertEquals(1L, ((StateMachineInstance) variableInstanceFacade.find(sm.getId(), p)).getCurrentStateId(), .1);
                }
            }
        }

        /* player fire event  -> NO MOVE */
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event');"), null);
        requestFacade.commit();
        assertEquals(0, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        gameModelFacade.reset(scenario.getId());
        requestFacade.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 */
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event');Event.fire('event2');"), null);
        requestFacade.commit();
        assertEquals(1, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        gameModelFacade.reset(scenario.getId());
        requestFacade.getRequestManager().getEventCounter().clear();
        /* player fire event twice and event2 */
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event'); Event.fire('event'); Event.fire('event2');"), null);
        requestFacade.commit();
        assertEquals(11, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        gameModelFacade.reset(scenario.getId());
        requestFacade.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 twice*/
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event'); Event.fire('event2'); Event.fire('event2');"), null);
        requestFacade.commit();
        assertEquals(101, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        // Clean up
        variableDescriptorFacade.remove(number.getId());
        variableDescriptorFacade.remove(sm.getId());
    }

    @Test
    public void testMultipleEventTransition_twoEvents_OR() throws NamingException, WegasScriptException {
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(0));
        number.setScope(new PlayerScope());
        variableDescriptorFacade.create(scenario.getId(), number);

        StateMachineDescriptor sm = new StateMachineDescriptor();
        StateMachineInstance smi = new StateMachineInstance();
        smi.setCurrentStateId(1L);
        sm.setDefaultInstance(smi);
        sm.setScope(new PlayerScope());
        sm.setName("testSM");

        State state1 = new State();

        State state2 = new State();
        state2.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').add(self, 1)"));

        State state3 = new State();
        state3.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').add(self, 10)"));

        State state4 = new State();
        state4.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').add(self, 100)"));

        sm.setStates(toMap(toList(1L, 2L, 3L, 4L), toList(state1, state2, state3, state4)));

        Transition t1 = new Transition();
        t1.setTriggerCondition(new Script("Event.fired('event') || Event.fired('event2')"));
        t1.setNextStateId(2L);
        state1.setTransitions(toList(t1));

        Transition t2 = new Transition();
        t2.setTriggerCondition(new Script("Event.fired('event')"));
        t2.setNextStateId(3L);

        Transition t3 = new Transition();
        t3.setTriggerCondition(new Script("Event.fired('event2')"));
        t3.setNextStateId(4L);

        state2.setTransitions(toList(t2, t3));

        variableDescriptorFacade.create(scenario.getId(), sm);
        gameModelFacade.reset(scenario.getId());
        //Test for all players, nothing should change.
        for (Game g : scenario.getGames()) {
            for (Team t : g.getTeams()) {
                for (Player p : t.getPlayers()) {
                    assertEquals(0, ((NumberInstance) variableInstanceFacade.find(number.getId(), p)).getValue(), .1);
                    assertEquals(1L, ((StateMachineInstance) variableInstanceFacade.find(sm.getId(), p)).getCurrentStateId(), .1);
                }
            }
        }

        /* player fire event  -> NO MOVE */
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event');"), null);
        requestFacade.commit();
        assertEquals(1, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        gameModelFacade.reset(scenario.getId());
        requestFacade.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 */
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event2');"), null);
        requestFacade.commit();
        assertEquals(1, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        gameModelFacade.reset(scenario.getId());
        requestFacade.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 */
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event');Event.fire('event');"), null);
        requestFacade.commit();
        assertEquals(11, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        gameModelFacade.reset(scenario.getId());
        requestFacade.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 */
        scriptFacade.eval(player, new Script("JavaScript", "Event.fire('event');Event.fire('event2');"), null);
        requestFacade.commit();
        assertEquals(101, ((NumberInstance) variableInstanceFacade.find(number.getId(), player)).getValue(), .1);

        // Clean up
        variableDescriptorFacade.remove(number.getId());
        variableDescriptorFacade.remove(sm.getId());
    }
}
