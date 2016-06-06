/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import javax.naming.NamingException;
import junit.framework.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class ScriptFacadeTest extends AbstractEJBTest {

    private static final Logger logger = LoggerFactory.getLogger(ScriptFacadeTest.class);

    @Test
    public void testEval() throws NamingException, WegasScriptException {
        final String VARIABLENAME = "testvariable";
        final String VALUE = "test-value";
        final String VALUE2 = "test-value2";
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ScriptFacade sm = lookupBy(ScriptFacade.class);

        final NumberDescriptor numberDescriptor = new NumberDescriptor("inttest");
        numberDescriptor.setDefaultInstance(new NumberInstance(1));
        vdf.create(gameModel.getId(), numberDescriptor);

        // Create a dummy descriptor
        final StringDescriptor stringDescriptor = new StringDescriptor(VARIABLENAME);
        stringDescriptor.setDefaultInstance(new StringInstance(VALUE));
        vdf.create(gameModel.getId(), stringDescriptor);

        // Eval a dummy script
        final Script s = new Script();
        s.setLanguage("JavaScript");
        s.setContent(VARIABLENAME + ".value = \"" + VALUE2 + "\"");
        sm.eval(player.getId(), s, null);
        logger.info("Tested " + sm);

        // Verify the new value
        final StringInstance instance = (StringInstance) vif.find(stringDescriptor.getId(), player.getId());
        Assert.assertEquals(VALUE2, instance.getValue());

        //Test with events
        final Script testEvent = new Script("Event.on('testEvent', function(o){VariableDescriptorFacade.findByName(gameModel,'" + VARIABLENAME + "').getInstance(self).setValue(o.value);});\nEvent.fire('testEvent', {'value':'" + VALUE + "'});");
        testEvent.setLanguage("JavaScript");
        sm.eval(player.getId(), testEvent, null);
        Assert.assertEquals(VALUE, ((StringInstance) vif.find(stringDescriptor.getId(), player.getId())).getValue());
    }
}
