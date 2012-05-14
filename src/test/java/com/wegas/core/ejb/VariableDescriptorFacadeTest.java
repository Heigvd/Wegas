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

import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.primitive.BooleanDescriptorEntity;
import com.wegas.core.persistence.variable.primitive.BooleanInstanceEntity;
import com.wegas.core.persistence.variable.primitive.StringDescriptorEntity;
import com.wegas.core.persistence.variable.primitive.StringInstanceEntity;
import com.wegas.core.persistence.variable.scope.TeamScopeEntity;
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
        StringDescriptorEntity stringDescriptor = new StringDescriptorEntity(VARIABLENAME);
        stringDescriptor.setDefaultInstance(new StringInstanceEntity(VALUE));
        stringDescriptor.setScope(new TeamScopeEntity());

        StringDescriptorEntity stringDescriptor2 = new StringDescriptorEntity(VARIABLENAME2);
        stringDescriptor2.setDefaultInstance(new StringInstanceEntity(VALUE2));
        this.testVariableDescriptor(stringDescriptor, stringDescriptor2);

        // Check its value
        StringInstanceEntity instance = (StringInstanceEntity) vif.find(stringDescriptor.getId(), player);
        Assert.assertEquals(VALUE2, instance.getValue());

        // Edit the variable instance
        vif.update(stringDescriptor.getId(), player.getId(), new StringInstanceEntity(VALUE3));

        // Verify the new value
        instance = (StringInstanceEntity) vif.find(stringDescriptor.getId(), player.getId());
        Assert.assertEquals(VALUE3, instance.getValue());

        // Reset the game and test
        gameModelFacade.reset(gameModel.getId());
        instance = (StringInstanceEntity) vif.find(stringDescriptor.getId(), player);
        Assert.assertEquals(VALUE2, instance.getValue());
    }

    @Test
    public void testBooleanDescriptor() throws NamingException {

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class, VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class, VariableInstanceFacade.class);

        // Test the descriptor
        BooleanDescriptorEntity booleanDescriptor = new BooleanDescriptorEntity(VARIABLENAME);
        booleanDescriptor.setDefaultInstance(new BooleanInstanceEntity(true));
        booleanDescriptor.setScope(new TeamScopeEntity());
        BooleanDescriptorEntity booleanDescriptor2 = new BooleanDescriptorEntity(VARIABLENAME2);
        booleanDescriptor2.setDefaultInstance(new BooleanInstanceEntity(false));
        this.testVariableDescriptor(booleanDescriptor, booleanDescriptor2);

        // Check its value
        BooleanInstanceEntity instance = (BooleanInstanceEntity) vif.find(booleanDescriptor.getId(), player);
        Assert.assertEquals(false, instance.getValue());

        // Edit the variable instance
        vif.update(booleanDescriptor.getId(), player.getId(), new BooleanInstanceEntity(true));

        // Verify the new value
        instance = (BooleanInstanceEntity) vif.find(booleanDescriptor.getId(), player.getId());
        Assert.assertEquals(true, instance.getValue());

        // Reset the game and test
        gameModelFacade.reset(gameModel.getId());
        instance = (BooleanInstanceEntity) vif.find(booleanDescriptor.getId(), player);
        Assert.assertEquals(false, instance.getValue());
    }

    public <T extends VariableDescriptorEntity> T testVariableDescriptor(T descriptor1, T descriptor2)
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
