
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.security.util.ActAsPlayer;
import com.wegas.test.arquillian.AbstractArquillianTest;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 *
 * @author maxence
 */
public class DelayedScriptEventFacadeTest extends AbstractArquillianTest {

    @Test
    public void testDelayedEvent() throws WegasNoResultException, InterruptedException {

        String str1OriValue = "Value 1 ori";
        String str2OriValue = "Value 2 ori";

        String str1NewValue = "Value 1 NEW";
        String str2NewValue = "Value 2 NEW";
        String str1Name = "myString";
        String str2Name = "my2ndString";

        String delayedEventName = "3secDelay";
        String eventName = "noDelay";

        // a string descriptor
        StringDescriptor myString = new StringDescriptor();
        myString.setName(str1Name);
        myString.setDefaultInstance(new StringInstance());
        myString.getDefaultInstance().setValue(str1OriValue);
        variableDescriptorFacade.create(scenario.getId(), myString);

        // a string descriptor
        StringDescriptor my2ndString = new StringDescriptor();
        my2ndString.setName(str2Name);
        my2ndString.setDefaultInstance(new StringInstance());
        my2ndString.getDefaultInstance().setValue(str2OriValue);
        variableDescriptorFacade.create(scenario.getId(), my2ndString);

        // a trigger triggered by '3secDelay' event
        TriggerDescriptor myTrigger = new TriggerDescriptor();
        myTrigger.setDefaultInstance(new StateMachineInstance());
        myTrigger.setName("aTrigger");
        myTrigger.setTriggerEvent(new Script("Javascript", "Event.fired(\"" + delayedEventName + "\")"));
        myTrigger.setPostTriggerEvent(new Script("Javascript", "Variable.find(gameModel, \"" + str1Name + "\").setValue(self, \"" + str1NewValue + "\");"));
        variableDescriptorFacade.create(scenario.getId(), myTrigger);

        // a 2nd trigger triggered by 'noDelay' event
        TriggerDescriptor my2ndTrigger = new TriggerDescriptor();
        my2ndTrigger.setDefaultInstance(new StateMachineInstance());
        my2ndTrigger.setName("aTrigger");
        my2ndTrigger.setTriggerEvent(new Script("Javascript", "Event.fired(\"" + eventName + "\")"));
        my2ndTrigger.setPostTriggerEvent(new Script("Javascript", "Variable.find(gameModel, \"" + str2Name + "\").setValue(self, \"" + str2NewValue + "\");"));
        variableDescriptorFacade.create(scenario.getId(), my2ndTrigger);

        //send std 'noDelay' event  AND '3secDelay' delayed event
        final Script fireEvents = new Script("JavaScript", "Event.fire('" + eventName + "');DelayedEvent.delayedFire(0, 3, \"" + delayedEventName + "\");");
        try (ActAsPlayer a = requestManager.actAsPlayer(player)) {
            a.setFlushOnExit(false);
            scriptFacade.eval(player.getId(), fireEvents, null);
            // eval trigger
            requestFacade.commit(player);
        }

        // before delay timeout
        Assertions.assertEquals(str1OriValue, ((StringDescriptor) variableDescriptorFacade.find(scenario, str1Name)).getValue(player), "String 1 value is not the original one"); // not yet
        Assertions.assertEquals(str2NewValue, ((StringDescriptor) variableDescriptorFacade.find(scenario, str2Name)).getValue(player), "String 2 value is not the new one"); // changed by no-delay event

        Thread.sleep(4000);

        // after delay timeout
        Assertions.assertEquals(str1NewValue, ((StringDescriptor) variableDescriptorFacade.find(scenario, str1Name)).getValue(player), "String 1 value is not the new one"); // not yet
        Assertions.assertEquals(str2NewValue, ((StringDescriptor) variableDescriptorFacade.find(scenario, str2Name)).getValue(player), "String 2 value is not the new one"); // changed by no-delay event
    }
}
