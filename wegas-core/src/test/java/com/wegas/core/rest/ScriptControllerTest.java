/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.util.Map;
import jakarta.inject.Inject;
import jakarta.naming.NamingException;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author Cyril Junod (cyril.junod at gmail.com)
 */
public class ScriptControllerTest extends AbstractArquillianTest {

    @Inject
    private ScriptController scriptController;

    /**
     * Test of testGameModel method, of class ScriptController.
     *
     * @throws jakarta.naming.NamingException
     */
    @Test
    public void testTestGameModel() throws NamingException {
        System.out.println("testGameModel");
        final int EXPECTED_ERRORS = 1;

        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setMinValue(0.0);
        number.setDefaultInstance(new NumberInstance(1));

        variableDescriptorFacade.create(scenario.getId(), number);
        Assert.assertEquals(1.0, ((NumberDescriptor) variableDescriptorFacade.find(number.getId())).getInstance(player).getValue(), 0.000001);

        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new StateMachineInstance());
        trigger.setTriggerEvent(new Script("false and errored"));
        trigger.setPostTriggerEvent(new Script("Variable.find(gameModel,'notavar').add(self, 2)"));
        variableDescriptorFacade.create(scenario.getId(), trigger);

        TriggerDescriptor trigger2 = new TriggerDescriptor();
        trigger2.setDefaultInstance(new StateMachineInstance());
        trigger2.setTriggerEvent(new Script("true"));
        trigger2.setPostTriggerEvent(new Script("Variable.find(gameModel,'testnumber').add(self, 8)"));
        variableDescriptorFacade.create(scenario.getId(), trigger2);

        TriggerDescriptor trigger3 = new TriggerDescriptor();
        trigger3.setDefaultInstance(new StateMachineInstance());
        trigger3.setPostTriggerEvent(new Script("Variable.find(gameModel,'testnumber').add(self, -2)"));
        variableDescriptorFacade.create(scenario.getId(), trigger3);

        Map<Long, WegasScriptException> results = scriptController.testGameModel(scenario.getId());
        Assert.assertEquals("Errored scripts", EXPECTED_ERRORS, results.size());
        Assert.assertTrue(results.containsKey(trigger.getId()));
        Assert.assertFalse(results.containsKey(trigger2.getId()));
        Assert.assertEquals(1.0, ((NumberDescriptor) variableDescriptorFacade.find(number.getId())).getInstance(player).getValue(), 0.000001);

    }

}
