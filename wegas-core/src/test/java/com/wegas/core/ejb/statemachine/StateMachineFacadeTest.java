/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.statemachine;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import javax.naming.NamingException;
import static org.junit.Assert.assertEquals;
import org.junit.Test;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class StateMachineFacadeTest extends AbstractEJBTest {

    /**
     * Test of entityUpdateListener method, of class StateMachineFacade.
     */
    @Test
    public void testTrigger() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);

        // Create a number
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(0));
        number.setScope(new TeamScope());
        vdf.create(gameModel.getId(), number);

        // Create a resource
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setScope(new TeamScope());
        trigger.setTriggerEvent(new Script("testnumber.value >= 0.9"));
        trigger.setPostTriggerEvent(new Script("testnumber.value = 2"));
        vdf.create(gameModel.getId(), trigger);

        // Do an update
        NumberInstance numberI = number.getInstance(player);
        numberI.setValue(1);
        vif.update(numberI.getId(), numberI);

        // Test
        assertEquals(2.0, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);

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
        final RequestFacade requestFacade = lookupBy(RequestFacade.class);

        // Create a number
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(5));
        number.setScope(new TeamScope());
        vdf.create(gameModel.getId(), number);

        // Create a resource
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setScope(new TeamScope());
        trigger.setTriggerEvent(new Script("true"));
        trigger.setPostTriggerEvent(new Script("VariableDescriptorFacade.find(" + number.getId() + ").setValue(self, 3)"));
        vdf.create(gameModel.getId(), trigger);

        // Do an update
        NumberInstance numberI = number.getInstance(player);
        numberI.setValue(4);
        vif.update(numberI.getId(), numberI);
        requestFacade.commit();

        // Test
        assertEquals(3.0, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);
        assertEquals(3.0, ((NumberInstance) vif.find(number.getId(), player2)).getValue(), .1);

        // Reset
        gameModelFacade.reset(gameModel.getId());

        // Test
        assertEquals(3.0, ((NumberInstance) vif.find(number.getId(), player)).getValue(), .1);
        assertEquals(3.0, ((NumberInstance) vif.find(number.getId(), player2)).getValue(), .1);

        // Clean up
        vdf.remove(number.getId());
        vdf.remove(trigger.getId());
    }
}
