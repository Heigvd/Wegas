/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import static com.wegas.core.ejb.AbstractEJBTest.gameModel;
import static com.wegas.core.ejb.AbstractEJBTest.gameModelFacade;
import static com.wegas.core.ejb.AbstractEJBTest.lookupBy;
import static com.wegas.core.ejb.AbstractEJBTest.player;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.*;
import com.wegas.core.persistence.variable.scope.TeamScope;
import java.util.List;
import javax.naming.NamingException;
import junit.framework.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class VariableDescriptorFacadeTest extends AbstractEJBTest {

    private static final Logger logger = LoggerFactory.getLogger(VariableDescriptorFacadeTest.class);

    @Test
    public void testNumberDescriptor() throws NamingException {
        final String VARIABLENAME = "test-variable";
        final String VARIABLENAME2 = "test-variable2";
        final double VAL1 = 0;
        final double VAL2 = 1;
        final double VAL3 = 2;

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);

        // Test the descriptor
        NumberDescriptor desc1 = new NumberDescriptor(VARIABLENAME);
        desc1.setDefaultInstance(new NumberInstance(VAL1));
        desc1.setScope(new TeamScope());

        NumberDescriptor desc2 = new NumberDescriptor(VARIABLENAME2);
        desc2.setDefaultInstance(new NumberInstance(VAL2));
        this.testVariableDescriptor(desc1, desc2);

        // Check its value
        NumberInstance instance = (NumberInstance) vif.find(desc1.getId(), player);
        Assert.assertEquals(VAL2, instance.getValue());

        // Edit the variable instance
        vif.update(desc1.getId(), player.getId(), new NumberInstance(VAL3));

        // Verify the new value
        instance = (NumberInstance) vif.find(desc1.getId(), player.getId());
        Assert.assertEquals(VAL3, instance.getValue());

        // Reset the game and test
        gameModelFacade.reset(gameModel.getId());
        instance = (NumberInstance) vif.find(desc1.getId(), player);
        Assert.assertEquals(VAL2, instance.getValue());

        vdf.remove(desc1.getId());
    }

    @Test
    public void testStringDescriptor() throws NamingException {
        final String VARIABLENAME = "test-variable";
        final String VARIABLENAME2 = "test-variable2";
        final String VALUE1 = "test-value";
        final String VALUE2 = "test-value2";
        final String VALUE3 = "test-value3";

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);

        // Test the descriptor
        StringDescriptor stringDescriptor = new StringDescriptor(VARIABLENAME);
        stringDescriptor.setDefaultInstance(new StringInstance(VALUE1));
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

        vdf.remove(stringDescriptor.getId());
    }

    @Test
    public void testBooleanDescriptor() throws NamingException {

        final String VARIABLENAME = "test-variable";
        final String VARIABLENAME2 = "test-variable2";
        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);

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

        vdf.remove(booleanDescriptor.getId());
    }

    public <T extends VariableDescriptor> T testVariableDescriptor(T descriptor1, T descriptor2)
            throws NamingException {
        final String VARIABLENAME2 = "test-variable2";
        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);

        // Create the descriptor
        logger.info("" + descriptor1 + "*" + descriptor2);
        vdf.create(gameModel.getId(), descriptor1);

        // Edit this descriptor
        vdf.update(descriptor1.getId(), descriptor2);

        gameModelFacade.reset(gameModel.getId());

        // Check edition
        T findByName = (T) vdf.find(gameModel, VARIABLENAME2);
        Assert.assertEquals(descriptor1.getId(), findByName.getId());
        Assert.assertEquals(descriptor2.getName(), findByName.getName());

        // Check the findByClass Function
        T findByClass = (T) vdf.findByClass(gameModel, descriptor1.getClass()).get(0);
        Assert.assertEquals(descriptor1.getId(), findByClass.getId());

        // Check the findByGameModel function
        T findByRootGameModelId = (T) vdf.findAll(gameModel.getId()).get(0);
        Assert.assertEquals(descriptor1.getId(), findByRootGameModelId.getId());

        return descriptor1;
    }

    @Test
    public void testMove2P() throws NamingException {
        final String VARIABLENAME = "test-variable";
        final String VARIABLENAME2 = "test-variable2";
        final double VAL1 = 0;
        final double VAL2 = 1;
        final double VAL3 = 2;

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);

        // Test the descriptor
        NumberDescriptor desc1 = new NumberDescriptor(VARIABLENAME);
        desc1.setDefaultInstance(new NumberInstance(VAL1));
        desc1.setScope(new TeamScope());

        NumberDescriptor desc2 = new NumberDescriptor(VARIABLENAME2);
        desc2.setDefaultInstance(new NumberInstance(VAL2));
        this.testVariableDescriptor(desc1, desc2);

        // Check its value
        NumberInstance instance = (NumberInstance) vif.find(desc1.getId(), player);
        Assert.assertEquals(VAL2, instance.getValue());

        // Edit the variable instance
        vif.update(desc1.getId(), player.getId(), new NumberInstance(VAL3));

        // Verify the new value
        instance = (NumberInstance) vif.find(desc1.getId(), player.getId());
        Assert.assertEquals(VAL3, instance.getValue());

        // Reset the game and test
        gameModelFacade.reset(gameModel.getId());
        instance = (NumberInstance) vif.find(desc1.getId(), player);
        Assert.assertEquals(VAL2, instance.getValue());

        vdf.remove(desc1.getId());
    }

    @Test
    public void testMove2() throws NamingException {
        final String VARIABLENAME = "test-variable";
        final String VARIABLENAME2 = "test-variable2";
        final String VARIABLENAME3 = "test-variable3";
        final String SUBNAME1 = "test-variable4";
        final String VALUE1 = "test-value";

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);

        // 1st case: move from root to root
        StringDescriptor vd1 = new StringDescriptor(VARIABLENAME);
        vd1.setDefaultInstance(new StringInstance(VALUE1));
        vd1.setScope(new TeamScope());
        vdf.create(gameModel.getId(), vd1);

        StringDescriptor vd2 = new StringDescriptor(VARIABLENAME2);
        vd2.setDefaultInstance(new StringInstance(VALUE1));
        vd2.setScope(new TeamScope());
        vdf.create(gameModel.getId(), vd2);

        vdf.move(vd1.getId(), 1);                                               // Move first item to second position
        List<VariableDescriptor> findByGameModelId = vdf.findByGameModelId(gameModel.getId());// Refresh
        Assert.assertEquals(VARIABLENAME, findByGameModelId.get(1).getName());

        // 2nd case: from list to root
        ListDescriptor vd3 = new ListDescriptor(VARIABLENAME3);
        vd3.setDefaultInstance(new ListInstance());
        vd3.setScope(new TeamScope());
        vdf.create(gameModel.getId(), vd3);

        StringDescriptor sub1 = new StringDescriptor(SUBNAME1);
        sub1.setDefaultInstance(new StringInstance(VALUE1));
        sub1.setScope(new TeamScope());
        vdf.createChild(vd3.getId(), sub1);

        findByGameModelId = vdf.findByGameModelId(gameModel.getId());           // Refresh
        Assert.assertEquals(SUBNAME1, ((ListDescriptor) findByGameModelId.get(2)).item(0).getName());

        vdf.move(sub1.getId(), 0);                                              // Move at first position
        findByGameModelId = vdf.findByGameModelId(gameModel.getId());           // Refresh
        Assert.assertEquals(SUBNAME1, findByGameModelId.get(0).getName());
        Assert.assertEquals(0, ((ListDescriptor) findByGameModelId.get(3)).size());

        vdf.remove(vd1.getId());
        vdf.remove(vd2.getId());
        vdf.remove(vd3.getId());
        vdf.remove(sub1.getId());
    }

    @Test
    public void testMove3P() throws NamingException {
        final String VARIABLENAME1 = "test-variable";
        final String VARIABLENAME2 = "test-variable2";
        final String VARIABLENAME3 = "test-variable4";
        final String LISTNAME1 = "test-variable3";
        final String LISTNAME2 = "test-variable3dasdas";
        final String VALUE1 = "test-value";

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);

        // 1st case: move from descriptor to descriptor
        ListDescriptor list1 = new ListDescriptor(LISTNAME1);
        list1.setDefaultInstance(new ListInstance());
        list1.setScope(new TeamScope());
        vdf.create(gameModel.getId(), list1);

        StringDescriptor vd1 = new StringDescriptor(VARIABLENAME1);
        vd1.setDefaultInstance(new StringInstance(VALUE1));
        vd1.setScope(new TeamScope());
        vdf.createChild(list1.getId(), vd1);

        StringDescriptor vd2 = new StringDescriptor(VARIABLENAME2);
        vd2.setDefaultInstance(new StringInstance(VALUE1));
        vd2.setScope(new TeamScope());
        vdf.createChild(list1.getId(), vd2);
        List<VariableDescriptor> childrenDescriptors = vdf.findByGameModelId(gameModel.getId());
        Assert.assertEquals(VARIABLENAME1, ((ListDescriptor) childrenDescriptors.get(0)).item(0).getName());// Check if item was successfully added

        vdf.move(vd1.getId(), list1.getId(), 1);                                // Move first item to second position
        childrenDescriptors = vdf.findByGameModelId(gameModel.getId());         // Refresh
        Assert.assertEquals(VARIABLENAME2, ((ListDescriptor) childrenDescriptors.get(0)).item(0).getName());

        // 2nd case: from root to descriptor
        StringDescriptor vd3 = new StringDescriptor(VARIABLENAME3);
        vd3.setDefaultInstance(new StringInstance(VALUE1));
        vd3.setScope(new TeamScope());
        vdf.create(gameModel.getId(), vd3);

        vdf.move(vd3.getId(), list1.getId(), 0);                                // Move first item to index 0
        childrenDescriptors = vdf.findByGameModelId(gameModel.getId());         // Refresh
        Assert.assertEquals(VARIABLENAME3, ((ListDescriptor) childrenDescriptors.get(0)).item(0).getName());
        Assert.assertEquals(1, childrenDescriptors.size());

        // 3rd case: from one descriptor to another
        ListDescriptor list2 = new ListDescriptor(LISTNAME2);
        list2.setDefaultInstance(new ListInstance());
        list2.setScope(new TeamScope());
        vdf.create(gameModel.getId(), list2);

        vdf.move(vd3.getId(), list2.getId(), 0);                                // Move first item to index 0
        childrenDescriptors = vdf.findByGameModelId(gameModel.getId());         // Refresh
        Assert.assertEquals(VARIABLENAME3, ((ListDescriptor) childrenDescriptors.get(1)).item(0).getName());
        Assert.assertEquals(2, ((ListDescriptor) childrenDescriptors.get(0)).size());

        vdf.remove(vd1.getId());                                                // Clean up
        vdf.remove(vd2.getId());
        vdf.remove(vd3.getId());
        vdf.remove(list1.getId());
        vdf.remove(list2.getId());
    }
}
