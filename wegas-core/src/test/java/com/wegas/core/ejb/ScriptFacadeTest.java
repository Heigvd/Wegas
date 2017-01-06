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
import javax.script.ScriptException;
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

    @Test
    public void testBypassRandom() throws NamingException, WegasScriptException, ScriptException {
        final ScriptFacade sf = lookupBy(ScriptFacade.class);
        RequestFacade requestFacade = RequestFacade.lookup();

        Script rnd100 = new Script("JavaScript", "var sum = 0, i; for (i=0;i<100;i++){sum+= Math.random();} sum;");

        requestFacade.getRequestManager().setEnv(RequestManager.RequestEnvironment.STD);
        Double rnd1 = (Double) sf.eval(player, rnd100, null);

        requestFacade.getRequestManager().setEnv(RequestManager.RequestEnvironment.TEST);
        Double rnd_bypassed = (Double) sf.eval(player, rnd100, null);

        requestFacade.getRequestManager().setEnv(RequestManager.RequestEnvironment.STD);

        Double rnd2 = (Double) sf.eval(player, rnd100, null);

        Assert.assertTrue(rnd1 > 0.0);
        Assert.assertEquals(0.0, rnd_bypassed, 0.001);
        Assert.assertTrue(rnd2 > 0.0);
    }

    @Test
    public void testCheckCondition() throws NamingException, WegasScriptException, ScriptException {
        final ScriptFacade sf = lookupBy(ScriptFacade.class);
        final ScriptCheck sc = lookupBy(ScriptCheck.class);
        RequestFacade requestFacade = RequestFacade.lookup();

        Script condition = new Script("JavaScript", "Event.fired(\"myEvent\") && Math.random() * 100 < 1 && Variable.find(gameModel, \"x\").getValue(self)!==0;");

        //Standard Mode -> since first event has not been
        Boolean result = (Boolean) sf.eval(player, condition, null);

        WegasScriptException ex = sc.validate(condition, player, null);

        System.out.println("R1: " + result);
        System.out.println("Ex: " + ex);

    }
}
