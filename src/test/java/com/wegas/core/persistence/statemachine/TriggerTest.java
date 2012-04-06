/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.persistence.statemachine;

import com.wegas.core.persistence.variable.statemachine.Trigger;
import com.wegas.core.script.ScriptEntity;
import org.junit.*;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class TriggerTest {

    private Trigger trigger;

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
        this.trigger = new Trigger();
        this.trigger.setLabel("testTrigger");
        ScriptEntity scriptEntity = new ScriptEntity();
        scriptEntity.setLanguage("JavaScript");
        scriptEntity.setContent("var x=10; x+=2;");
        this.trigger.setTriggerEvent(scriptEntity);
        this.trigger.setPostTriggerEvent(scriptEntity);
    }

    @After
    public void tearDown() {
    }

    /**
     * Test of generateTrigger method, of class Trigger.<br/> One shot trigger
     */
    @Test
    public void testGenerateTrigger() {
        System.out.println("OneShotTrigger");
        this.trigger.setOneShot(true);
        this.trigger.generateTrigger();
        assert this.trigger.getStates().get(1).getTransitions().get(0).getNextState() == 2;
        assert this.trigger.getStates().get(2).getTransitions().isEmpty();

    }

    /**
     * Test of generateTrigger method, of class Trigger.<br/> Opposed Trigger
     */
    @Test
    public void testGenerateOpposedTrigger() {
        System.out.println("OpposedTrigger");
        this.trigger.setOneShot(false);
        this.trigger.setOpposedTrigger(true);
        this.trigger.generateTrigger();
        assert this.trigger.getStates().get(1).getTransitions().get(0).getNextState() == 2;
        assert this.trigger.getStates().get(2).getTransitions().get(0).getNextState() == 1;
        //TODO : check reverse condition.
    }

    /**
     * Test of generateTrigger method, of class Trigger.<br/> Loop Trigger
     */
    @Test
    public void testGenerateLoopTrigger() {
        System.out.println("LoopTrigger");
        this.trigger.setOneShot(false);
        this.trigger.setOpposedTrigger(false);
        this.trigger.generateTrigger();
        assert this.trigger.getStates().get(1).getTransitions().get(0).getNextState() == 1;
    }
}
