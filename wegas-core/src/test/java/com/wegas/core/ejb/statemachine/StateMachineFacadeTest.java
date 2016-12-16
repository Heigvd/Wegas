/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.ejb.*;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.PlayerScope;
import com.wegas.core.persistence.variable.statemachine.*;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.naming.NamingException;
import java.util.ArrayList;
import java.util.List;

import static com.wegas.core.ejb.TestHelper.toList;
import static com.wegas.core.ejb.TestHelper.toMap;
import static org.junit.Assert.assertEquals;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class StateMachineFacadeTest extends AbstractEJBTest {

    protected static final Logger logger = LoggerFactory.getLogger(StateMachineFacadeTest.class);

    /**
     * Test of entityUpdateListener method, of class StateMachineFacade.
     *
     * @throws javax.naming.NamingException
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
        vdf.create(gameModel.getId(), number);

        // Create a trigger
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("Variable.find(gameModel, \"testnumber\").getInstance(self).value >= 0.9"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel, \"testnumber\").getInstance(self).value = 2;"));
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
        vdf.create(gameModel.getId(), number);

        // Create a resource
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
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
        state1.setOnEnterEvent(new Script("Variable.find(gameModel, \"testnumber\").getInstance(self).value += 5"));
        State state2 = new State();
        state2.setOnEnterEvent(new Script("Variable.find(gameModel, \"testnumber\").getInstance(self).value += 10"));
        sm.setStates(toMap(toList(1L, 2L, 3L), toList(state0, state1, state2)));
        Transition t1 = new Transition();
        t1.setPreStateImpact(new Script("Variable.find(gameModel, \"testnumber\").getInstance(self).value +=1"));
        Transition t2 = new Transition();
        t2.setPreStateImpact(new Script("Variable.find(gameModel, \"testnumber\").getInstance(self).value +=2"));

        t1.setNextStateId(2L);
        t2.setNextStateId(3L);
        state0.setTransitions(toList(t1));
        state1.setTransitions(toList(t2));
        vdf.create(gameModel.getId(), sm);
        gmf.reset(gameModel.getId());
        //Test for all players.
        for (Game g : gameModel.getGames()) {
            for (Team t : g.getTeams()) {
                for (Player p : t.getPlayers()) {
                    assertEquals(INITIALVALUE + 1 + 5 + 2 + 10, ((NumberInstance) vif.find(number.getId(), p)).getValue(), .1);
                    assertEquals(3L, ((StateMachineInstance) vif.find(sm.getId(), p)).getCurrentStateId(), .1);
                }
            }
        }

        // Clean up
        vdf.remove(number.getId());
        vdf.remove(sm.getId());
    }

    @Test
    public void testDialogue() throws NamingException {
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final GameModelFacade gmf = lookupBy(GameModelFacade.class);
        final StateMachineFacade stateMachineFacade = lookupBy(StateMachineFacade.class);

        DialogueDescriptor dial = new DialogueDescriptor();
        dial.setName("dial");
        StateMachineInstance dialI = new StateMachineInstance();
        dialI.setCurrentStateId(1L);
        dial.setDefaultInstance(dialI);
        dial.setScope(new PlayerScope());

        DialogueState ds1 = new DialogueState();
        DialogueState ds2 = new DialogueState();
        ds1.setText("Hello");
        ds2.setText("World");
        dial.setStates(toMap(toList(1L, 2L), toList(ds1, ds2)));

        DialogueTransition s1ToS2 = new DialogueTransition();
        s1ToS2.setNextStateId(2L);
        s1ToS2.setActionText(", ");
        ds1.setTransitions(toList(s1ToS2));
        vdf.create(gameModel.getId(), dial);
        gmf.reset(gameModel.getId());
        assertEquals("Hello", (((DialogueState) ((StateMachineInstance) vif.find(dial.getId(), player.getId())).getCurrentState()).getText()));
        stateMachineFacade.doTransition(gameModel.getId(), player.getId(), dial.getId(), s1ToS2.getId());
        assertEquals("World", (((DialogueState) ((StateMachineInstance) vif.find(dial.getId(), player.getId())).getCurrentState()).getText()));
    }

    @Test
    public void testEventTransition() throws NamingException, WegasScriptException {
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final GameModelFacade gmf = lookupBy(GameModelFacade.class);
        final ScriptFacade sf = lookupBy(ScriptFacade.class);
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
        state1.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, Variable.find(gameModel, 'testnumber').getValue(self) + 5)"));
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

        vdf.create(gameModel.getId(), sm);
        gmf.reset(gameModel.getId());
        //Test for all players, nothing should change.
        for (Game g : gameModel.getGames()) {
            for (Team t : g.getTeams()) {
                for (Player p : t.getPlayers()) {
                    assertEquals(INITIALVALUE, ((NumberInstance) vif.find(number.getId(), p)).getValue(), .1);
                    assertEquals(1L, ((StateMachineInstance) vif.find(sm.getId(), p)).getCurrentStateId(), .1);
                }
            }
        }

        /* player fire event twice */
        sf.eval(player, new Script("JavaScript", "Event.fire('event');Event.fire('event')"), null);
        RequestFacade rf = RequestFacade.lookup();
        rf.commit(true);
        assertEquals(INITIALVALUE + 5 + 10, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        /* player21 fire event only once */
        sf.eval(player21, new Script("JavaScript", "Event.fire('event');"), null);
        rf.commit(true);
        assertEquals(INITIALVALUE + 5, ((NumberInstance) vif.find(number.getId(), player21)).getValue(), .1);
        // Clean up
        vdf.remove(number.getId());
        vdf.remove(sm.getId());
    }

    @Test
    public void testMultipleEventTransition_oneEvent() throws NamingException, WegasScriptException {
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final GameModelFacade gmf = lookupBy(GameModelFacade.class);
        final ScriptFacade sf = lookupBy(ScriptFacade.class);
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
        state1.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, Variable.find(gameModel, 'testnumber').getValue(self) + 1)"));
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

        vdf.create(gameModel.getId(), sm);
        gmf.reset(gameModel.getId());
        //Test for all players, nothing should change.
        for (Game g : gameModel.getGames()) {
            for (Team t : g.getTeams()) {
                for (Player p : t.getPlayers()) {
                    assertEquals(INITIALVALUE, ((NumberInstance) vif.find(number.getId(), p)).getValue(), .1);
                    assertEquals(1L, ((StateMachineInstance) vif.find(sm.getId(), p)).getCurrentStateId(), .1);
                }
            }
        }

        RequestFacade rf = RequestFacade.lookup();

        /* player fire event  -> NO MOVE */
        sf.eval(player, new Script("JavaScript", "Event.fire('event');"), null);
        rf.commit(true);
        assertEquals(0, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        gmf.reset(gameModel.getId());
        rf.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 */
        sf.eval(player, new Script("JavaScript", "Event.fire('event');Event.fire('event');"), null);
        rf.commit(true);
        assertEquals(1, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        gmf.reset(gameModel.getId());
        rf.getRequestManager().getEventCounter().clear();
        /* player fire event twice and event2 */
        sf.eval(player, new Script("JavaScript", "Event.fire('event'); Event.fire('event'); Event.fire('event');"), null);
        rf.commit(true);
        assertEquals(11, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        // Clean up
        vdf.remove(number.getId());
        vdf.remove(sm.getId());
    }

    @Test
    public void testMultipleEventTransition_twoEvents() throws NamingException, WegasScriptException {
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final GameModelFacade gmf = lookupBy(GameModelFacade.class);
        final ScriptFacade sf = lookupBy(ScriptFacade.class);
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(0));
        number.setScope(new PlayerScope());
        vdf.create(gameModel.getId(), number);

        StateMachineDescriptor sm = new StateMachineDescriptor();
        StateMachineInstance smi = new StateMachineInstance();
        smi.setCurrentStateId(1L);
        sm.setDefaultInstance(smi);
        sm.setScope(new PlayerScope());
        sm.setName("testSM");

        State state1 = new State();

        State state2 = new State();
        state2.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, Variable.find(gameModel, 'testnumber').getValue(self) + 1)"));

        State state3 = new State();
        state3.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, Variable.find(gameModel, 'testnumber').getValue(self) + 10)"));

        State state4 = new State();
        state4.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, Variable.find(gameModel, 'testnumber').getValue(self) + 100)"));

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

        vdf.create(gameModel.getId(), sm);
        gmf.reset(gameModel.getId());
        //Test for all players, nothing should change.
        for (Game g : gameModel.getGames()) {
            for (Team t : g.getTeams()) {
                for (Player p : t.getPlayers()) {
                    assertEquals(0, ((NumberInstance) vif.find(number.getId(), p)).getValue(), .1);
                    assertEquals(1L, ((StateMachineInstance) vif.find(sm.getId(), p)).getCurrentStateId(), .1);
                }
            }
        }

        RequestFacade rf = RequestFacade.lookup();

        /* player fire event  -> NO MOVE */
        sf.eval(player, new Script("JavaScript", "Event.fire('event');"), null);
        rf.commit(true);
        assertEquals(0, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        gmf.reset(gameModel.getId());
        rf.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 */
        sf.eval(player, new Script("JavaScript", "Event.fire('event');Event.fire('event2');"), null);
        rf.commit(true);
        assertEquals(1, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        gmf.reset(gameModel.getId());
        rf.getRequestManager().getEventCounter().clear();
        /* player fire event twice and event2 */
        sf.eval(player, new Script("JavaScript", "Event.fire('event'); Event.fire('event'); Event.fire('event2');"), null);
        rf.commit(true);
        assertEquals(11, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        gmf.reset(gameModel.getId());
        rf.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 twice*/
        sf.eval(player, new Script("JavaScript", "Event.fire('event'); Event.fire('event2'); Event.fire('event2');"), null);
        rf.commit(true);
        assertEquals(101, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        // Clean up
        vdf.remove(number.getId());
        vdf.remove(sm.getId());
    }

    @Test
    public void testMultipleEventTransition_twoEvents_OR() throws NamingException, WegasScriptException {
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final GameModelFacade gmf = lookupBy(GameModelFacade.class);
        final ScriptFacade sf = lookupBy(ScriptFacade.class);
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(0));
        number.setScope(new PlayerScope());
        vdf.create(gameModel.getId(), number);

        StateMachineDescriptor sm = new StateMachineDescriptor();
        StateMachineInstance smi = new StateMachineInstance();
        smi.setCurrentStateId(1L);
        sm.setDefaultInstance(smi);
        sm.setScope(new PlayerScope());
        sm.setName("testSM");

        State state1 = new State();

        State state2 = new State();
        state2.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, Variable.find(gameModel, 'testnumber').getValue(self) + 1)"));

        State state3 = new State();
        state3.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, Variable.find(gameModel, 'testnumber').getValue(self) + 10)"));

        State state4 = new State();
        state4.setOnEnterEvent(new Script("Variable.find(gameModel, 'testnumber').setValue(self, Variable.find(gameModel, 'testnumber').getValue(self) + 100)"));

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

        vdf.create(gameModel.getId(), sm);
        gmf.reset(gameModel.getId());
        //Test for all players, nothing should change.
        for (Game g : gameModel.getGames()) {
            for (Team t : g.getTeams()) {
                for (Player p : t.getPlayers()) {
                    assertEquals(0, ((NumberInstance) vif.find(number.getId(), p)).getValue(), .1);
                    assertEquals(1L, ((StateMachineInstance) vif.find(sm.getId(), p)).getCurrentStateId(), .1);
                }
            }
        }

        RequestFacade rf = RequestFacade.lookup();

        /* player fire event  -> NO MOVE */
        sf.eval(player, new Script("JavaScript", "Event.fire('event');"), null);
        rf.commit(true);
        assertEquals(1, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        gmf.reset(gameModel.getId());
        rf.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 */
        sf.eval(player, new Script("JavaScript", "Event.fire('event2');"), null);
        rf.commit(true);
        assertEquals(1, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        gmf.reset(gameModel.getId());
        rf.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 */
        sf.eval(player, new Script("JavaScript", "Event.fire('event');Event.fire('event');"), null);
        rf.commit(true);
        assertEquals(11, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        gmf.reset(gameModel.getId());
        rf.getRequestManager().getEventCounter().clear();
        /* player fire event and event2 */
        sf.eval(player, new Script("JavaScript", "Event.fire('event');Event.fire('event2');"), null);
        rf.commit(true);
        assertEquals(101, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

        // Clean up
        vdf.remove(number.getId());
        vdf.remove(sm.getId());
    }
}
