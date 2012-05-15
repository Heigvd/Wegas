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
import com.wegas.core.persistence.variable.primitive.StringDescriptorEntity;
import com.wegas.core.persistence.variable.primitive.StringInstanceEntity;
import com.wegas.core.persistence.variable.scope.TeamScopeEntity;
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
        ScriptManager sm = lookupBy(ScriptManager.class, ScriptManager.class);

        // Create a dummy descriptor
        StringDescriptorEntity stringDescriptor = new StringDescriptorEntity(VARIABLENAME);
        stringDescriptor.setDefaultInstance(new StringInstanceEntity(VALUE));
        stringDescriptor.setScope(new TeamScopeEntity());
        vdf.create(gameModel.getId(), stringDescriptor);

        // Eval a dummy script
        ScriptEntity s = new ScriptEntity();
        s.setLanguage("JavaScript");
        s.setContent(VARIABLENAME + ".value = \"" + VALUE2 + "\"");
        sm.eval(player.getId(), s);
        logger.info("Tested " + sm);

        // Verify the new value
        StringInstanceEntity instance = (StringInstanceEntity) vif.find(stringDescriptor.getId(), player.getId());
        Assert.assertEquals(VALUE2, instance.getValue());
    }
}
