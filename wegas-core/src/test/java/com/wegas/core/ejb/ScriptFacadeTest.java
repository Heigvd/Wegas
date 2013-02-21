/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import javax.naming.NamingException;
import javax.script.ScriptException;
import junit.framework.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class ScriptFacadeTest extends AbstractEJBTest {

    private static final Logger logger = LoggerFactory.getLogger(ScriptFacadeTest.class);

    @Test
    public void testEval() throws NamingException, ScriptException, WegasException {
        final String VARIABLENAME = "testvariable";
        final String VALUE = "test-value";
        final String VALUE2 = "test-value2";
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ScriptFacade sm = lookupBy(ScriptFacade.class);


        final NumberDescriptor numberDescriptor = new NumberDescriptor("inttest");
        numberDescriptor.setDefaultInstance(new NumberInstance(1));
        numberDescriptor.setScope(new TeamScope());
        vdf.create(gameModel.getId(), numberDescriptor);

        // Create a dummy descriptor
        final StringDescriptor stringDescriptor = new StringDescriptor(VARIABLENAME);
        stringDescriptor.setDefaultInstance(new StringInstance(VALUE));
        stringDescriptor.setScope(new TeamScope());
        vdf.create(gameModel.getId(), stringDescriptor);

        // Eval a dummy script
        final Script s = new Script();
        s.setLanguage("JavaScript");
        s.setContent(VARIABLENAME + ".value = \"" + VALUE2 + "\"");
        sm.eval(player.getId(), s);
        logger.info("Tested " + sm);

        // Verify the new value
        final StringInstance instance = (StringInstance) vif.find(stringDescriptor.getId(), player.getId());
        Assert.assertEquals(VALUE2, instance.getValue());
    }
}
