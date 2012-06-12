/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vdf.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.script;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import javax.naming.NamingException;
import javax.script.ScriptException;
import junit.framework.Assert;
import org.junit.Test;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class ScriptManagerTest extends AbstractEJBTest {

    // *** Constants *** //
    final static private String VARIABLENAME = "testvariable";
    final static private String VALUE = "test-value";
    final static private String VALUE2 = "test-value2";

    @Test
    public void testEval() throws NamingException, ScriptException {

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class, VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class, VariableInstanceFacade.class);
        ScriptFacade sm = lookupBy(ScriptFacade.class, ScriptFacade.class);

        // Create a dummy descriptor
        StringDescriptor stringDescriptor = new StringDescriptor(VARIABLENAME);
        stringDescriptor.setDefaultInstance(new StringInstance(VALUE));
        stringDescriptor.setScope(new TeamScope());
        vdf.create(gameModel.getId(), stringDescriptor);

        // Eval a dummy script
        ScriptEntity s = new ScriptEntity();
        s.setLanguage("JavaScript");
        s.setContent(VARIABLENAME + ".value = \"" + VALUE2 + "\"");
        sm.eval(player.getId(), s);
        logger.info("Tested " + sm);

        // Verify the new value
        StringInstance instance = (StringInstance) vif.find(stringDescriptor.getId(), player.getId());
        Assert.assertEquals(VALUE2, instance.getValue());
    }
}
