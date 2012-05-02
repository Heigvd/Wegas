/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.statemachine;

import com.wegas.core.persistence.variable.statemachine.TriggerDescriptorEntity;
import com.wegas.core.persistence.variable.statemachine.TriggerInstanceEntity;
import com.wegas.core.script.ScriptEntity;
import org.junit.*;

/**
 * Testing Triggers, class TriggerInstanceEntity and class TriggerDescriptorEntity
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class TriggerTest {

    private TriggerInstanceEntity trigger;
    private TriggerDescriptorEntity triggerDescriptor;

    public TriggerTest() {
    }

    @BeforeClass
    public static void setUpClass() throws Exception {
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
    }

    @Before
    public void setUp() {
        this.trigger = new TriggerInstanceEntity();
        this.triggerDescriptor = (TriggerDescriptorEntity) this.trigger.getScope().getVariableDescriptor();
        this.triggerDescriptor.setName("testTrigger");
        ScriptEntity scriptEntity = new ScriptEntity();
        scriptEntity.setLanguage("JavaScript");
        scriptEntity.setContent("var x=10; x+=2;");
        this.triggerDescriptor.setTriggerEvent(scriptEntity);
        this.triggerDescriptor.setPostTriggerEvent(scriptEntity);
    }

    @After
    public void tearDown() {
    }

    /**
     * Test of generateTriggerDescriptor method, of class TriggerDescriptorEntity.<br/> One shot trigger
     */
    @Test
    public void testGenerateTrigger() {
        System.out.println("OneShotTrigger");
        this.triggerDescriptor.setOneShot(true);
//        this.triggerDescriptor.generateTriggerDescriptor();
        assert this.triggerDescriptor.getStates().get(1L).getTransitions().get(0).getNextStateId() == 2;
        assert this.triggerDescriptor.getStates().get(2L).getTransitions().isEmpty();

    }



    /**
     * Test of generateTriggerDescriptor method, of class TriggerDescriptorEntity.<br/> Loop Trigger
     */
    @Test
    public void testGenerateLoopTrigger() {
        System.out.println("LoopTrigger");
        this.triggerDescriptor.setOneShot(false);
       // this.triggerDescriptor.generateTriggerDescriptor();
        assert this.triggerDescriptor.getStates().get(1).getTransitions().get(0).getNextStateId() == 1;
    }
}
