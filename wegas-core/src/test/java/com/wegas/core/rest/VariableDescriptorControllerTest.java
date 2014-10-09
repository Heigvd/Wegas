/*
 * Wegas
 * http://wegas.albasim.ch
  
 * Copyright (c) 2014 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest;

import com.wegas.core.ejb.AbstractEJBTest;
import static com.wegas.core.ejb.AbstractEJBTest.lookupBy;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.statemachine.TriggerDescriptor;
import com.wegas.core.persistence.variable.statemachine.TriggerInstance;
import javax.naming.NamingException;
import org.junit.Assert;
import org.junit.Test;

/**
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class VariableDescriptorControllerTest extends AbstractEJBTest {

    public VariableDescriptorControllerTest() {
    }


    @Test
    public void testContains() throws NamingException {
        System.out.println("contains");
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableDescriptorController controller = lookupBy(VariableDescriptorController.class);
        NumberDescriptor number = new NumberDescriptor();
        number.setName("testnumber");
        number.setDefaultInstance(new NumberInstance(1));
        vdf.create(gameModel.getId(), number);
        Assert.assertTrue(controller.idsContains(gameModel.getId(), "testnum").contains(number.getId()));
        
        TriggerDescriptor trigger = new TriggerDescriptor();
        trigger.setDefaultInstance(new TriggerInstance());
        trigger.setTriggerEvent(new Script("true"));
        trigger.setPostTriggerEvent(new Script("var imascriptcontent"));
        vdf.create(gameModel.getId(), trigger);
        Assert.assertTrue(controller.idsContains(gameModel.getId(), "imascriptcontent").contains(trigger.getId()));
    }

}
