/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.statemachine;

import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import java.util.Objects;
import static org.junit.Assert.assertTrue;
import org.junit.Before;
import org.junit.Test;

/**
 * Testing Triggers, class TriggerInstance and class TriggerDescriptor
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class TriggerTest {

    private TriggerInstance trigger;
    private TriggerDescriptor triggerDescriptor;
    private Script scriptEntity;

    @Before
    public void setUp() {
        this.trigger = new TriggerInstance();
        // this.trigger.setId(666L);
        this.triggerDescriptor = new TriggerDescriptor();
        this.triggerDescriptor.setDefaultInstance(this.trigger);
        this.triggerDescriptor.setName("testTrigger");
        this.scriptEntity = new Script();
        this.scriptEntity.setLanguage("JavaScript");
        this.scriptEntity.setContent("var x=10; x+=2;");
        this.triggerDescriptor.setTriggerEvent(scriptEntity);
        this.triggerDescriptor.setPostTriggerEvent(scriptEntity);
    }

    /**
     * Test of buildStateMachine/onload <br/> oneShot trigger
     */
    @Test
    public void testGenerateTrigger() {
        System.out.println("OneShotTrigger");
        this.triggerDescriptor.setOneShot(true);
        assertTrue(this.triggerDescriptor.getStates().get(1L).getTransitions().get(0).getNextStateId() == 2L);
        assertTrue(this.triggerDescriptor.getStates().get(2L).getTransitions().size() == 1);
        assertTrue(this.triggerDescriptor.getDefaultInstance().getCurrentStateId() == 1L);
        assertTrue(triggerDescriptor.getStates().get(2L).getOnEnterEvent().equals(this.triggerDescriptor.getPostTriggerEvent()));
        //testing onLoad method
        this.triggerDescriptor.setTriggerEvent(null);
        this.triggerDescriptor.setPostTriggerEvent(null);
        assertTrue(this.triggerDescriptor.getPostTriggerEvent() == null);
        assertTrue(this.triggerDescriptor.getTriggerEvent() == null);
        assertTrue(triggerDescriptor.getStates().get(2L).getOnEnterEvent() == null);
    }

    /**
     * Test of buildStateMachine/onLoad <br/> Loop Trigger
     */
    @Test
    public void testGenerateLoopTrigger() {
        System.out.println("LoopTrigger");
        this.triggerDescriptor.setOneShot(false);
        assertTrue(this.triggerDescriptor.getStates().get(1L).getTransitions().get(0).getNextStateId() == 2L);
        assertTrue(this.triggerDescriptor.getStates().size() == 2);
        assertTrue(this.triggerDescriptor.getDefaultInstance().getCurrentStateId() == 1L);
        assertTrue(triggerDescriptor.getStates().get(2L).getOnEnterEvent().equals(scriptEntity));
        //testing onLoad method
        this.triggerDescriptor.setTriggerEvent(null);
        this.triggerDescriptor.setPostTriggerEvent(null);
        assertTrue(this.triggerDescriptor.getPostTriggerEvent() == null);
        assertTrue(this.triggerDescriptor.getTriggerEvent() == null);
    }

    @Test
    public void testNullScripts() {
        System.out.println("NullScripts");
        this.triggerDescriptor.setOneShot(false);
        this.triggerDescriptor.setPostTriggerEvent(null);
        this.triggerDescriptor.setTriggerEvent(null);
        this.triggerDescriptor.setPostTriggerEvent(this.scriptEntity);
        this.triggerDescriptor.setTriggerEvent(this.scriptEntity);
        assertTrue(this.triggerDescriptor.getPostTriggerEvent().equals(scriptEntity));
        assertTrue(this.triggerDescriptor.getTriggerEvent().equals(scriptEntity));
    }

    @Test
    public void testMerge() {
        System.out.println("Merge trigger");
        TriggerInstance instanceEntity = new TriggerInstance();
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

        this.triggerDescriptor.merge(newTrigger);
        // assertTrue(this.triggerDescriptor.getId() == 4L);
        assertTrue(this.triggerDescriptor.getPostTriggerEvent().equals(newTestScript));
        assertTrue(this.triggerDescriptor.getTriggerEvent().equals(newTestScript));
        assertTrue((this.triggerDescriptor.getPostTriggerEvent().getContent() == null ? newTestScript.getContent() == null : this.triggerDescriptor.getPostTriggerEvent().getContent().equals(newTestScript.getContent())));
        assertTrue((this.triggerDescriptor.getPostTriggerEvent().getLanguage() == null ? newTestScript.getLanguage() == null : this.triggerDescriptor.getPostTriggerEvent().getLanguage().equals(newTestScript.getLanguage())));
        assertTrue(this.triggerDescriptor.getScope().getClass().equals(TeamScope.class));
        assertTrue(this.triggerDescriptor.getDefaultInstance().getCurrentStateId().equals(instanceEntity.getCurrentStateId()));
        assertTrue(Objects.equals(this.triggerDescriptor.getDefaultInstance().getId(), this.trigger.getId()));
    }
}
