/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.statemachine;

import com.wegas.core.Helper;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import java.util.Objects;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Testing Triggers, class StateMachineInstance and class TriggerDescriptor
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class TriggerTest {

    private StateMachineInstance trigger;
    private TriggerDescriptor triggerDescriptor;
    private Script scriptEntity;

    @BeforeEach
    public void setUp() {
        this.trigger = new StateMachineInstance();
        // this.trigger.setId(666L);
        this.triggerDescriptor = new TriggerDescriptor();
        this.triggerDescriptor.setDefaultInstance(this.trigger);
        this.triggerDescriptor.setName("testTrigger");
        this.scriptEntity = new Script();
        this.scriptEntity.setLanguage("JavaScript");
        this.scriptEntity.setContent("var x=10; x+=2;");
        this.triggerDescriptor.setTriggerEvent(scriptEntity);
        this.triggerDescriptor.setPostTriggerEvent(scriptEntity);
        this.triggerDescriptor.buildStateMachine();
    }

    /**
     * Test of buildStateMachine/onload <br/> oneShot trigger
     */
    @Test
    public void testGenerateTrigger() {
        System.out.println("OneShotTrigger");
        this.triggerDescriptor.setOneShot(true);
        this.triggerDescriptor.buildStateMachine();
        assertTrue(this.triggerDescriptor.getStates().get(1L).getTransitions().get(0).getNextStateId() == 2L);
        assertTrue(this.triggerDescriptor.getStates().get(2L).getTransitions().size() == 1);
        assertTrue(this.triggerDescriptor.getDefaultInstance().getCurrentStateId() == 1L);
        assertTrue(triggerDescriptor.getStates().get(2L).getOnEnterEvent().equals(this.triggerDescriptor.getPostTriggerEvent()));
        //testing onLoad method
        this.triggerDescriptor.setTriggerEvent(new Script());
        this.triggerDescriptor.setPostTriggerEvent(new Script());
        this.triggerDescriptor.buildStateMachine();
        assertTrue(Helper.isNullOrEmpty(this.triggerDescriptor.getPostTriggerEvent().getContent()));
        assertTrue(Helper.isNullOrEmpty(this.triggerDescriptor.getTriggerEvent().getContent()));
        assertTrue(Helper.isNullOrEmpty(triggerDescriptor.getStates().get(2L).getOnEnterEvent().getContent()));
    }

    /**
     * Test of buildStateMachine/onLoad <br/> Loop Trigger
     */
    @Test
    public void testGenerateLoopTrigger() {
        System.out.println("LoopTrigger");
        this.triggerDescriptor.setOneShot(false);
        this.triggerDescriptor.buildStateMachine();
        assertTrue(this.triggerDescriptor.getStates().get(1L).getTransitions().get(0).getNextStateId() == 2L);
        assertTrue(this.triggerDescriptor.getStates().size() == 2);
        assertTrue(this.triggerDescriptor.getDefaultInstance().getCurrentStateId() == 1L);
        assertTrue(triggerDescriptor.getStates().get(2L).getOnEnterEvent().equals(scriptEntity));
        //testing onLoad method
        this.triggerDescriptor.setTriggerEvent(new Script());
        this.triggerDescriptor.setPostTriggerEvent(new Script());
        this.triggerDescriptor.buildStateMachine();
        assertTrue(Helper.isNullOrEmpty(this.triggerDescriptor.getPostTriggerEvent().getContent()));
        assertTrue(Helper.isNullOrEmpty(this.triggerDescriptor.getTriggerEvent().getContent()));
    }

    @Test
    public void testNullScripts() {
        System.out.println("NullScripts");
        this.triggerDescriptor.setOneShot(false);
        this.triggerDescriptor.setPostTriggerEvent(null);
        this.triggerDescriptor.setTriggerEvent(null);
        this.triggerDescriptor.setPostTriggerEvent(this.scriptEntity);
        this.triggerDescriptor.setTriggerEvent(this.scriptEntity);
        this.triggerDescriptor.buildStateMachine();
        assertTrue(this.triggerDescriptor.getPostTriggerEvent().equals(scriptEntity));
        assertTrue(this.triggerDescriptor.getTriggerEvent().equals(scriptEntity));
    }

    @Test
    public void testMerge() {
        System.out.println("Merge trigger");
        StateMachineInstance instanceEntity = new StateMachineInstance();
        //   instanceEntity.setId(45L);
        instanceEntity.setCurrentStateId(2L);
        this.triggerDescriptor.setOneShot(false);
        //  this.triggerDescriptor.setId(4L);
        this.triggerDescriptor.setScope(new TeamScope());
        TriggerDescriptor newTrigger = new TriggerDescriptor();
        newTrigger.setDefaultInstance(this.trigger);
        // newTrigger.setId(5L);
        newTrigger.setOneShot(true);
        Script newTestScript = new Script();
        newTestScript.setLanguage("Python");
        newTestScript.setContent("TestScript;");
        newTrigger.setPostTriggerEvent(newTestScript);
        newTrigger.setDefaultInstance(instanceEntity);
        newTrigger.setTriggerEvent(newTestScript);
        newTrigger.buildStateMachine();

        this.triggerDescriptor.merge(newTrigger);

        // assertTrue(this.triggerDescriptor.getId() == 4L);
        //assertTrue(this.triggerDescriptor.getPostTriggerEvent().equals(newTestScript));

        //assertTrue(this.triggerDescriptor.getTriggerEvent().equals(newTestScript));


        assertTrue((this.triggerDescriptor.getPostTriggerEvent().getContent() == null ? newTestScript.getContent() == null : this.triggerDescriptor.getPostTriggerEvent().getContent().equals(newTestScript.getContent())));
        assertTrue((this.triggerDescriptor.getPostTriggerEvent().getLanguage() == null ? newTestScript.getLanguage() == null : this.triggerDescriptor.getPostTriggerEvent().getLanguage().equals(newTestScript.getLanguage())));
        assertTrue(this.triggerDescriptor.getScope().getClass().equals(TeamScope.class));
        assertTrue(this.triggerDescriptor.getDefaultInstance().getCurrentStateId().equals(instanceEntity.getCurrentStateId()));
        assertTrue(Objects.equals(this.triggerDescriptor.getDefaultInstance().getId(), this.trigger.getId()));
    }
}
