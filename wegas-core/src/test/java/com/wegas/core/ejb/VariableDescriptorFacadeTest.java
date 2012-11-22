/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vdf.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.BooleanDescriptor;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.scope.TeamScope;
import javax.naming.NamingException;
import junit.framework.Assert;
import org.junit.Test;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class VariableDescriptorFacadeTest extends AbstractEJBTest {

    // *** Constants *** //
    final static private String VARIABLENAME = "test-variable";
    final static private String VARIABLENAME2 = "test-variable2";
    final static private String VALUE = "test-value";
    final static private String VALUE2 = "test-value2";
    final static private String VALUE3 = "test-value3";


    @Test
    public void testVariableDescriptor() throws NamingException {

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class, VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class, VariableInstanceFacade.class);

        // Test the descriptor
        StringDescriptor stringDescriptor = new StringDescriptor(VARIABLENAME);
        stringDescriptor.setDefaultInstance(new StringInstance(VALUE));
        stringDescriptor.setScope(new TeamScope());

        StringDescriptor stringDescriptor2 = new StringDescriptor(VARIABLENAME2);
        stringDescriptor2.setDefaultInstance(new StringInstance(VALUE2));
        this.testVariableDescriptor(stringDescriptor, stringDescriptor2);

        // Check its value
        StringInstance instance = (StringInstance) vif.find(stringDescriptor.getId(), player);
        Assert.assertEquals(VALUE2, instance.getValue());

        // Edit the variable instance
        vif.update(stringDescriptor.getId(), player.getId(), new StringInstance(VALUE3));

        // Verify the new value
        instance = (StringInstance) vif.find(stringDescriptor.getId(), player.getId());
        Assert.assertEquals(VALUE3, instance.getValue());

        // Reset the game and test
        gameModelFacade.reset(gameModel.getId());
        instance = (StringInstance) vif.find(stringDescriptor.getId(), player);
        Assert.assertEquals(VALUE2, instance.getValue());
    }

    @Test
    public void testBooleanDescriptor() throws NamingException {

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class, VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class, VariableInstanceFacade.class);

        // Test the descriptor
        BooleanDescriptor booleanDescriptor = new BooleanDescriptor(VARIABLENAME);
        booleanDescriptor.setDefaultInstance(new BooleanInstance(true));
        booleanDescriptor.setScope(new TeamScope());
        BooleanDescriptor booleanDescriptor2 = new BooleanDescriptor(VARIABLENAME2);
        booleanDescriptor2.setDefaultInstance(new BooleanInstance(false));
        this.testVariableDescriptor(booleanDescriptor, booleanDescriptor2);

        // Check its value
        BooleanInstance instance = (BooleanInstance) vif.find(booleanDescriptor.getId(), player);
        Assert.assertEquals(false, instance.getValue());

        // Edit the variable instance
        vif.update(booleanDescriptor.getId(), player.getId(), new BooleanInstance(true));

        // Verify the new value
        instance = (BooleanInstance) vif.find(booleanDescriptor.getId(), player.getId());
        Assert.assertEquals(true, instance.getValue());

        // Reset the game and test
        gameModelFacade.reset(gameModel.getId());
        instance = (BooleanInstance) vif.find(booleanDescriptor.getId(), player);
        Assert.assertEquals(false, instance.getValue());
    }

    public <T extends VariableDescriptor> T testVariableDescriptor(T descriptor1, T descriptor2)
            throws NamingException {
        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class, VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class, VariableInstanceFacade.class);

        // Create the descriptor
        logger.info(""+descriptor1+"*"+descriptor2);
        vdf.create(gameModel.getId(), descriptor1);

        // Edit this descriptor
        vdf.update(descriptor1.getId(), descriptor2);

        gameModelFacade.reset(gameModel.getId());

        // Check edition
        T findByName = (T) vdf.findByName(gameModel, VARIABLENAME2);
        Assert.assertEquals(descriptor1.getId(), findByName.getId());
        Assert.assertEquals(descriptor2.getName(), findByName.getName());

        // Check the findByClass Function
        T findByClass = (T) vdf.findByClass(gameModel, descriptor1.getClass()).get(0);
        Assert.assertEquals(VALUE, descriptor1.getId(), findByClass.getId());

        // Check the findByGameModel function
        T findByRootGameModelId = (T) vdf.findByGameModelId(gameModel.getId()).get(0);
        Assert.assertEquals(VALUE, descriptor1.getId(), findByRootGameModelId.getId());

        return descriptor1;
    }

}
