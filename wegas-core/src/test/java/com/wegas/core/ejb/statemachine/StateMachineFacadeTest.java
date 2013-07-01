/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import static com.wegas.core.ejb.AbstractEJBTest.lookupBy;
import com.wegas.core.ejb.*;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
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
}
