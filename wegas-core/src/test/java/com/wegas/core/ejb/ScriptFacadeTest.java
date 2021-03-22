/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.test.arquillian.AbstractArquillianTest;
import javax.ejb.EJBException;
import javax.inject.Inject;
import javax.naming.NamingException;
import javax.script.ScriptException;
import org.junit.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class ScriptFacadeTest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(ScriptFacadeTest.class);

    @Inject
    private ScriptCheck scriptCheck;

    @Test
    public void testEval() throws NamingException, WegasScriptException {
        final String VARIABLENAME = "testvariable";
        final String VALUE = "test-value";
        final String VALUE2 = "test-value2";

        final NumberDescriptor numberDescriptor = new NumberDescriptor("inttest");
        numberDescriptor.setDefaultInstance(new NumberInstance(1));
        variableDescriptorFacade.create(scenario.getId(), numberDescriptor);

        // Create a dummy descriptor
        final StringDescriptor stringDescriptor = new StringDescriptor(VARIABLENAME);
        stringDescriptor.setDefaultInstance(new StringInstance());
        stringDescriptor.getDefaultInstance().setValue(VALUE);
        variableDescriptorFacade.create(scenario.getId(), stringDescriptor);

        // Eval a dummy script
        final Script s = new Script();
        s.setLanguage("JavaScript");
        s.setContent("Variable.find(gameModel, \"" + VARIABLENAME + "\").setValue(self, \"" + VALUE2 + "\");");
        scriptFacade.eval(player.getId(), s, null);
        logger.info("Tested " + scriptFacade);

        // Verify the new value
        final StringInstance instance = (StringInstance) variableInstanceFacade.find(stringDescriptor.getId(), player.getId());
        Assert.assertEquals(VALUE2, instance.getValue());

        //Test with events
        final Script testEvent = new Script("Event.on('testEvent', function(o){Variable.find(gameModel,'" + VARIABLENAME + "').getInstance(self).setValue(o.value);});\nEvent.fire('testEvent', {'value':'" + VALUE + "'});");
        testEvent.setLanguage("JavaScript");
        scriptFacade.eval(player.getId(), testEvent, null);
        Assert.assertEquals(VALUE, ((StringInstance) variableInstanceFacade.find(stringDescriptor.getId(), player.getId())).getValue());
    }

    @Test
    public void testGlobalVar() throws NamingException, WegasScriptException {
        final NumberDescriptor numberDescriptor = new NumberDescriptor("gv");
        numberDescriptor.setDefaultInstance(new NumberInstance(1));
        variableDescriptorFacade.create(gameModel.getId(), numberDescriptor);

        String script = "gv = {value : 'hello, world!'}; print (gv.value);";

        scriptFacade.eval(player, new Script("JavaScript", script), null);

        scriptFacade.eval(player, new Script("JavaScript", "print('1g: ' + gv.value);"), null);

        scriptFacade.eval(player21, new Script("JavaScript", "print('2: ' + gv.value);"), null);

        //rf.getRequestManager().setCurrentScriptContext(null);
        scriptFacade.eval(player22, new Script("JavaScript", "print('3: ' + gv.value);"), null);
    }

    @Test
    public void testBypassRandom() throws NamingException, WegasScriptException, ScriptException {
        Script rnd100 = new Script("JavaScript", "var sum = 0, i; for (i=0;i<100;i++){sum+= Math.random();} sum;");

        requestFacade.getRequestManager().setEnv(RequestManager.RequestEnvironment.STD);
        Double rnd1 = (Double) scriptFacade.eval(player, rnd100, null);

        requestFacade.getRequestManager().setEnv(RequestManager.RequestEnvironment.TEST);
        Double rnd_bypassed = (Double) scriptFacade.eval(player, rnd100, null);

        requestFacade.getRequestManager().setEnv(RequestManager.RequestEnvironment.STD);

        Double rnd2 = (Double) scriptFacade.eval(player, rnd100, null);

        Assert.assertTrue(rnd1 > 0.0);
        Assert.assertEquals(0.0, rnd_bypassed, 0.001);
        Assert.assertTrue(rnd2 > 0.0);
    }

    @Test
    public void testCheckCondition() throws NamingException, WegasScriptException, ScriptException {
        Script condition = new Script("JavaScript", "Event.fired(\"myEvent\") && Math.random() * 100 < 1 && Variable.find(gameModel, \"x\").getValue(self)!==0;");

        //Standard Mode -> since first event has not been
        Boolean result = (Boolean) scriptFacade.eval(player, condition, null);

        WegasScriptException ex = scriptCheck.validate(condition, player, null);

        System.out.println("R1: " + result);
        System.out.println("Ex: " + ex);
    }

    //@Test
    public void benchmarkInjection() {
        int i = 0;
        long now, t;
        long start = now = System.currentTimeMillis();
        String script0 = "var x = 0;";
        String script1 = "var ctx =  new javax.naming.InitialContext(); ctx.lookup('java:module/GameModelFacade').find(1);";

        String script2 = "GameModelFacade.find(1);";


        int tick = 10_000;

        while (true) {
            i++;
            requestManager.setCurrentScriptContext(null);
            scriptFacade.eval(player, new Script("JavaScript", script0), null);
            if (i % tick == 0) {
                t = System.currentTimeMillis();
                logger.error(" {}x: {}", tick, t - now);
                now = t;
            }
        }
        //logger.error("TOTAL DURATION: {}", System.currentTimeMillis() - start);
    }

    @Test(expected = WegasScriptException.class)
    public void testTimeoutEvalInterrupts() throws Throwable {
        try {
            scriptFacade.timeoutEval(player.getId(), new Script("JavaScript", "while(1){}"));
        } catch (EJBException e) {
            throw e.getCause();
        }
    }

    @Test(expected = WegasScriptException.class)
    public void testTimeoutEvalInterrupts2() throws Throwable {
        try {
            scriptFacade.timeoutEval(player.getId(), new Script("JavaScript", "(function(){for(;;){}})()"));
        } catch (EJBException e) {
            throw e.getCause();
        }
    }

    @Test
    public void testTimeoutEval() {
        final double VALUE = 99;
        final NumberDescriptor numberDescriptor = new NumberDescriptor("testnum");
        numberDescriptor.setDefaultInstance(new NumberInstance(1));
        variableDescriptorFacade.create(scenario.getId(), numberDescriptor);

        scriptFacade.timeoutEval(player.getId(),
                new Script("JavaScript", "Variable.find(gameModel, 'testnum').setValue(self, " + VALUE + ");"));
        Assert.assertEquals(VALUE,
                ((NumberInstance) variableInstanceFacade.find(numberDescriptor.getId(), player.getId())).getValue(),
                0.0001);
        // Parser doing hoisting this, test for a correct injection.
        scriptFacade.timeoutEval(player.getId(), new Script("JavaScript", "(function a(c){c(); while(0){}\nfunction b(){c();}})(function(){})"));
    }
}
