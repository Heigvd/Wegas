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

import com.wegas.core.persistence.variable.scope.TeamScopeEntity;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptorEntity;
import com.wegas.core.persistence.variable.statemachine.TriggerInstanceEntity;
import com.wegas.core.script.ScriptEntity;
import org.junit.*;

/**
 * Testing Triggers, class TriggerInstanceEntity and class
 * TriggerDescriptorEntity
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class TriggerTest {

    private TriggerInstanceEntity trigger;
    private TriggerDescriptorEntity triggerDescriptor;
    private ScriptEntity scriptEntity;

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
        this.trigger.setId(666L);
        this.triggerDescriptor = new TriggerDescriptorEntity();
        this.triggerDescriptor.setDefaultInstance(this.trigger);
        this.triggerDescriptor.setName("testTrigger");
        this.scriptEntity = new ScriptEntity();
        this.scriptEntity.setLanguage("JavaScript");
        this.scriptEntity.setContent("var x=10; x+=2;");
        this.triggerDescriptor.setTriggerEvent(scriptEntity);
        this.triggerDescriptor.setPostTriggerEvent(scriptEntity);
    }

    @After
    public void tearDown() {
    }

    /**
     * Test of buildStateMachine/onload <br/> oneShot trigger
     */
    @Test
    public void testGenerateTrigger() {
        System.out.println("OneShotTrigger");
        this.triggerDescriptor.setOneShot(true);
        this.triggerDescriptor.buildStateMachine();
        assert this.triggerDescriptor.getStates().get(1L).getTransitions().get(0).getNextStateId() == 2L;
        assert this.triggerDescriptor.getStates().get(2L).getTransitions().isEmpty();
        assert ((TriggerInstanceEntity) this.triggerDescriptor.getDefaultVariableInstance()).getCurrentStateId() == 1L;
        //testing onLoad method
        this.triggerDescriptor.setTriggerEvent(null);
        this.triggerDescriptor.setPostTriggerEvent(null);
        this.triggerDescriptor.onLoad();
        assert this.triggerDescriptor.getPostTriggerEvent().equals(this.scriptEntity);
        assert this.triggerDescriptor.getTriggerEvent().equals(this.scriptEntity);
    }

    /**
     * Test of buildStateMachine/onLoad <br/> Loop Trigger
     */
    @Test
    public void testGenerateLoopTrigger() {
        System.out.println("LoopTrigger");
        this.triggerDescriptor.setOneShot(false);
        this.triggerDescriptor.buildStateMachine();
        assert this.triggerDescriptor.getStates().get(1L).getTransitions().get(0).getNextStateId() == 1L;
        assert this.triggerDescriptor.getStates().size() == 1;
        assert ((TriggerInstanceEntity) this.triggerDescriptor.getDefaultVariableInstance()).getCurrentStateId() == 1L;
        //testing onLoad method
        this.triggerDescriptor.setTriggerEvent(null);
        this.triggerDescriptor.setPostTriggerEvent(null);
        this.triggerDescriptor.onLoad();
        assert this.triggerDescriptor.getPostTriggerEvent().equals(this.scriptEntity);
        assert this.triggerDescriptor.getTriggerEvent().equals(this.scriptEntity);
    }

    @Test
    public void testNullScripts() {
        System.out.println("NullScripts");
        this.triggerDescriptor.setOneShot(false);
        this.triggerDescriptor.setPostTriggerEvent(null);
        this.triggerDescriptor.setTriggerEvent(null);
        this.triggerDescriptor.buildStateMachine();
        this.triggerDescriptor.setPostTriggerEvent(this.scriptEntity);
        this.triggerDescriptor.setTriggerEvent(this.scriptEntity);
        this.triggerDescriptor.onLoad();
        assert this.triggerDescriptor.getPostTriggerEvent() == null;
        assert this.triggerDescriptor.getTriggerEvent() == null;
    }

    @Test
    public void testMerge() {
        System.out.println("Merge trigger");
        TriggerInstanceEntity instanceEntity = new TriggerInstanceEntity();
        instanceEntity.setId(45L);
        instanceEntity.setCurrentStateId(2L);
        this.triggerDescriptor.setOneShot(false);
        this.triggerDescriptor.setId(4L);
        this.triggerDescriptor.buildStateMachine();
        this.triggerDescriptor.setScope(new TeamScopeEntity());
        TriggerDescriptorEntity newTrigger = new TriggerDescriptorEntity();
        newTrigger.setDefaultInstance(this.trigger);
        newTrigger.setId(5L);
        newTrigger.setOneShot(true);
        ScriptEntity newTestScript = new ScriptEntity();
        newTestScript.setLanguage("Python");
        newTestScript.setContent("TestScript;");
        newTrigger.setPostTriggerEvent(newTestScript);
        newTrigger.setDefaultInstance(instanceEntity);
        newTrigger.setTriggerEvent(newTestScript);
        this.triggerDescriptor.merge(newTrigger);
        assert this.triggerDescriptor.getId() == 4L;
        assert this.triggerDescriptor.getPostTriggerEvent().equals(newTestScript);
        assert this.triggerDescriptor.getTriggerEvent().equals(newTestScript);
        assert (this.triggerDescriptor.getPostTriggerEvent().getContent() == null ? newTestScript.getContent() == null : this.triggerDescriptor.getPostTriggerEvent().getContent().equals(newTestScript.getContent()));
        assert (this.triggerDescriptor.getPostTriggerEvent().getLanguage() == null ? newTestScript.getLanguage() == null : this.triggerDescriptor.getPostTriggerEvent().getLanguage().equals(newTestScript.getLanguage()));
        assert this.triggerDescriptor.getScope().getClass().equals(TeamScopeEntity.class);
        assert ((TriggerInstanceEntity) this.triggerDescriptor.getDefaultVariableInstance()).getCurrentStateId().equals(instanceEntity.getCurrentStateId());
        assert this.triggerDescriptor.getDefaultVariableInstance().getId() == this.trigger.getId();
    }
}
