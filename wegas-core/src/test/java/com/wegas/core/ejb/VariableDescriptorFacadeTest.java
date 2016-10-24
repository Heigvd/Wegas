/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import static com.wegas.core.ejb.AbstractEJBTest.gameModel;
import static com.wegas.core.ejb.AbstractEJBTest.gameModelFacade;
import static com.wegas.core.ejb.AbstractEJBTest.lookupBy;
import static com.wegas.core.ejb.AbstractEJBTest.player;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.*;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import java.io.IOException;
import java.util.List;
import javax.naming.NamingException;
import junit.framework.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class VariableDescriptorFacadeTest extends AbstractEJBTest {

    private static final Logger logger = LoggerFactory.getLogger(VariableDescriptorFacadeTest.class);

    @Test
    public void testDoubleReset() throws NamingException, WegasNoResultException {
        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);

        // Test the descriptor
        NumberDescriptor desc1 = new NumberDescriptor("x");
        desc1.setDefaultInstance(new NumberInstance(0));

        vdf.create(gameModel.getId(), desc1);

        gameModelFacade.reset(gameModel.getId());

        vdf.update(desc1.getId(), desc1);

        gameModelFacade.reset(gameModel.getId());
        gameModelFacade.reset(gameModel.getId());

        vdf.remove(desc1.getId());
    }

    @Test
    public void testNumberDescriptor() throws NamingException, WegasNoResultException {
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

        NumberDescriptor desc2 = new NumberDescriptor(VARIABLENAME2);
        desc2.setDefaultInstance(new NumberInstance(VAL2));
        this.testVariableDescriptor(desc1, desc2);

        // Check its value
        NumberInstance instance = (NumberInstance) vif.find(desc1.getId(), player);
        Assert.assertEquals(VAL2, instance.getValue());

        // Edit the variable instance
        NumberInstance newNumberInstance = new NumberInstance(VAL3);
        newNumberInstance.setVersion(instance.getVersion());

        vif.update(desc1.getId(), player.getId(), newNumberInstance);

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
    public void testStringDescriptor() throws NamingException, WegasNoResultException {
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

        StringDescriptor stringDescriptor2 = new StringDescriptor(VARIABLENAME2);
        stringDescriptor2.setDefaultInstance(new StringInstance(VALUE2));
        this.testVariableDescriptor(stringDescriptor, stringDescriptor2);

        // Check its value
        StringInstance instance = (StringInstance) vif.find(stringDescriptor.getId(), player);
        Assert.assertEquals(VALUE2, instance.getValue());

        // Edit the variable instance
        StringInstance newStringInstance = new StringInstance(VALUE3);
        newStringInstance.setVersion(instance.getVersion());

        vif.update(stringDescriptor.getId(), player.getId(), newStringInstance);

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
    public void testBooleanDescriptor() throws NamingException, WegasNoResultException {

        final String VARIABLENAME = "test-variable";
        final String VARIABLENAME2 = "test-variable2";
        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);

        // Test the descriptor
        BooleanDescriptor booleanDescriptor = new BooleanDescriptor(VARIABLENAME);
        booleanDescriptor.setDefaultInstance(new BooleanInstance(true));
        BooleanDescriptor booleanDescriptor2 = new BooleanDescriptor(VARIABLENAME2);
        booleanDescriptor2.setDefaultInstance(new BooleanInstance(false));
        this.testVariableDescriptor(booleanDescriptor, booleanDescriptor2);

        // Check its value
        BooleanInstance instance = (BooleanInstance) vif.find(booleanDescriptor.getId(), player);
        Assert.assertEquals(false, instance.getValue());

        // Edit the variable instance
        BooleanInstance newInstance = new BooleanInstance(true);
        newInstance.setVersion(instance.getVersion());
        vif.update(booleanDescriptor.getId(), player.getId(), newInstance);

        // Verify the new value
        instance = (BooleanInstance) vif.find(booleanDescriptor.getId(), player.getId());
        Assert.assertEquals(true, instance.getValue());

        // Reset the game and test
        gameModelFacade.reset(gameModel.getId());
        instance = (BooleanInstance) vif.find(booleanDescriptor.getId(), player);
        Assert.assertEquals(false, instance.getValue());

        vdf.remove(booleanDescriptor.getId());
    }

    @Test
    public void testGameModelScope() throws NamingException {

        final String VARIABLENAME = "test-variable";
        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);

        // Test the descriptor
        BooleanDescriptor desc = new BooleanDescriptor(VARIABLENAME);
        desc.setDefaultInstance(new BooleanInstance(true));
        desc.setScope(new GameModelScope());

        vdf.create(gameModel.getId(), desc);
        gameModelFacade.reset(gameModel.getId());

        Assert.assertEquals(desc.getId(), vif.find(desc.getId(), player).getDescriptorId());

        // Check its value
        BooleanInstance instance = (BooleanInstance) vif.find(desc.getId(), player);
        Assert.assertEquals(true, instance.getValue());

        // Edit the variable instance
        //vif.update(desc.getId(), player.getId(), new BooleanInstance(true));
        // Verify the new value
        //instance = (BooleanInstance) vif.find(desc.getId(), player.getId());
        //Assert.assertEquals(true, instance.getValue());
        // Reset the game and test
        // gameModelFacade.reset(gameModel.getId());
        // instance = (BooleanInstance) vif.find(desc.getId(), player);
        // Assert.assertEquals(false, instance.getValue());
        vdf.remove(desc.getId());
    }

    public <T extends VariableDescriptor> T testVariableDescriptor(T descriptor1, T descriptor2)
            throws NamingException, WegasNoResultException {
        final String VARIABLENAME2 = "test-variable2";
        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);

        // Create the descriptor
        logger.info("" + descriptor1 + "*" + descriptor2);
        vdf.create(gameModel.getId(), descriptor1);

        gameModelFacade.reset(gameModel.getId());

        // Edit this descriptor
        descriptor1 = (T) vdf.find(descriptor1.getId());

        /*
         * update against up-to-date version
         */
        descriptor2.setVersion(descriptor1.getVersion());
        descriptor2.getDefaultInstance().setVersion(descriptor1.getDefaultInstance().getVersion());

        vdf.update(descriptor1.getId(), descriptor2);

        // Edit this descriptor
        descriptor1 = (T) vdf.find(descriptor1.getId());

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
    public void testMove2P() throws NamingException, WegasNoResultException {
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

        NumberDescriptor desc2 = new NumberDescriptor(VARIABLENAME2);
        desc2.setDefaultInstance(new NumberInstance(VAL2));
        this.testVariableDescriptor(desc1, desc2);

        // Check its value
        NumberInstance instance = (NumberInstance) vif.find(desc1.getId(), player);
        Assert.assertEquals(VAL2, instance.getValue());

        // Edit the variable instance
        NumberInstance newInstance = new NumberInstance(VAL3);
        newInstance.setVersion(instance.getVersion());

        vif.update(desc1.getId(), player.getId(), newInstance);

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
        final String VARIABLENAME = "test_variable";
        final String VARIABLENAME2 = "test_variable2";
        final String VARIABLENAME3 = "test_variable3";
        final String SUBNAME1 = "test_variable4";
        final String VALUE1 = "test_value";

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        GameModel gm;

        // 1st case: move from root to root
        StringDescriptor vd1 = new StringDescriptor(VARIABLENAME);
        vd1.setDefaultInstance(new StringInstance(VALUE1));
        vdf.create(gameModel.getId(), vd1);

        gm = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(1, gm.getChildVariableDescriptors().size());
        Assert.assertEquals(1, gm.getVariableDescriptors().size());

        //gm = gameModelFacade.find(gameModel.getId());
        StringDescriptor vd2 = new StringDescriptor(VARIABLENAME2);
        vd2.setDefaultInstance(new StringInstance(VALUE1));
        vdf.create(gameModel.getId(), vd2);
        gm = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(2, gm.getChildVariableDescriptors().size());
        Assert.assertEquals(2, gm.getVariableDescriptors().size());

        vdf.move(vd1.getId(), 1);                                               // Move first item to second position
        List<VariableDescriptor> findByGameModelId = vdf.findByGameModelId(gameModel.getId());// Refresh
        Assert.assertEquals(VARIABLENAME, findByGameModelId.get(1).getName());

        // 2nd case: from list to root
        ListDescriptor vd3 = new ListDescriptor(VARIABLENAME3);
        vd3.setDefaultInstance(new ListInstance());
        vdf.create(gameModel.getId(), vd3);
        gm = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(3, gm.getChildVariableDescriptors().size());
        Assert.assertEquals(3, gm.getVariableDescriptors().size());

        StringDescriptor sub1 = new StringDescriptor(SUBNAME1);
        sub1.setDefaultInstance(new StringInstance(VALUE1));
        vdf.createChild(vd3.getId(), sub1);
        gm = gameModelFacade.find(gameModel.getId());
        // The last one in not at root level:
        Assert.assertEquals(3, gm.getChildVariableDescriptors().size());
        Assert.assertEquals(4, gm.getVariableDescriptors().size());

        findByGameModelId = vdf.findByGameModelId(gameModel.getId());           // Refresh
        Assert.assertEquals(SUBNAME1, ((ListDescriptor) findByGameModelId.get(2)).item(0).getName());

        vdf.move(sub1.getId(), 0);                                              // Move at first position
        gm = gameModelFacade.find(gameModel.getId());
        // now, it is:
        Assert.assertEquals(4, gm.getChildVariableDescriptors().size());
        Assert.assertEquals(4, gm.getVariableDescriptors().size());

        findByGameModelId = vdf.findByGameModelId(gameModel.getId());           // Refresh
        Assert.assertEquals(SUBNAME1, findByGameModelId.get(0).getName());
        Assert.assertEquals(0, ((ListDescriptor) findByGameModelId.get(3)).size());

        vdf.remove(vd1.getId());
        gm = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(3, gm.getVariableDescriptors().size());
        Assert.assertEquals(3, gm.getChildVariableDescriptors().size());
        vdf.remove(vd2.getId());
        gm = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(2, gm.getVariableDescriptors().size());
        Assert.assertEquals(2, gm.getChildVariableDescriptors().size());
        vdf.remove(vd3.getId());
        gm = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(1, gm.getVariableDescriptors().size());
        Assert.assertEquals(1, gm.getChildVariableDescriptors().size());
        vdf.remove(sub1.getId());
        gm = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(0, gm.getVariableDescriptors().size());
        Assert.assertEquals(0, gm.getChildVariableDescriptors().size());
    }

    @Test
    public void testMove3P() throws NamingException {
        final String VARIABLENAME1 = "test_variable";
        final String VARIABLENAME2 = "test_variable2";
        final String VARIABLENAME3 = "test_variable4";
        final String LISTNAME1 = "test_variable3";
        final String LISTNAME2 = "test_variable3dasdas";
        final String VALUE1 = "test_value";

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        GameModel gm;

        // 1st case: move from descriptor to descriptor
        ListDescriptor list1 = new ListDescriptor(LISTNAME1);
        list1.setDefaultInstance(new ListInstance());
        vdf.create(gameModel.getId(), list1);
        gm = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(1, gm.getVariableDescriptors().size());
        Assert.assertEquals(1, gm.getChildVariableDescriptors().size());

        StringDescriptor vd1 = new StringDescriptor(VARIABLENAME1);
        vd1.setDefaultInstance(new StringInstance(VALUE1));
        vdf.createChild(list1.getId(), vd1);
        gm = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(2, gm.getVariableDescriptors().size());
        Assert.assertEquals(1, gm.getChildVariableDescriptors().size());

        StringDescriptor vd2 = new StringDescriptor(VARIABLENAME2);
        vd2.setDefaultInstance(new StringInstance(VALUE1));
        vdf.createChild(list1.getId(), vd2);
        List<VariableDescriptor> childrenDescriptors = vdf.findByGameModelId(gameModel.getId());
        Assert.assertEquals(VARIABLENAME1, ((ListDescriptor) childrenDescriptors.get(0)).item(0).getName());// Check if item was successfully added
        gm = gameModelFacade.find(gameModel.getId());
        Assert.assertEquals(3, gm.getVariableDescriptors().size());
        Assert.assertEquals(1, gm.getChildVariableDescriptors().size());

        vdf.move(vd1.getId(), list1.getId(), 1);                                // Move first item to second position
        childrenDescriptors = vdf.findByGameModelId(gameModel.getId());         // Refresh
        Assert.assertEquals(VARIABLENAME2, ((ListDescriptor) childrenDescriptors.get(0)).item(0).getName());

        // 2nd case: from root to descriptor
        StringDescriptor vd3 = new StringDescriptor(VARIABLENAME3);
        vd3.setDefaultInstance(new StringInstance(VALUE1));
        vdf.create(gameModel.getId(), vd3);

        vdf.move(vd3.getId(), list1.getId(), 0);                                // Move first item to index 0
        childrenDescriptors = vdf.findByGameModelId(gameModel.getId());         // Refresh
        Assert.assertEquals(VARIABLENAME3, ((ListDescriptor) childrenDescriptors.get(0)).item(0).getName());
        Assert.assertEquals(1, childrenDescriptors.size());

        // 3rd case: from one descriptor to another
        ListDescriptor list2 = new ListDescriptor(LISTNAME2);
        list2.setDefaultInstance(new ListInstance());
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

    @Test
    public void testListDuplicate() throws NamingException, IOException, WegasNoResultException {
        final String VARIABLENAME1 = "test_variable";
        final String LISTNAME1 = "list1";
        final String LISTNAME2 = "list2";
        final String LISTNAME3 = "list3";
        final String LISTNAME4 = "list4";

        VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);

        ListDescriptor list1 = new ListDescriptor(LISTNAME1, new ListInstance());// Create a hierarchy of lists
        vdf.create(gameModel.getId(), list1);

        ListDescriptor list2 = new ListDescriptor(LISTNAME2, new ListInstance());
        vdf.createChild(list1.getId(), list2);

        ListDescriptor list3 = new ListDescriptor(LISTNAME3, new ListInstance());
        vdf.createChild(list1.getId(), list3);

        ListDescriptor list4 = new ListDescriptor(LISTNAME4, new ListInstance());
        vdf.createChild(list3.getId(), list4);

        NumberDescriptor nb = new NumberDescriptor(VARIABLENAME1, new NumberInstance(10));
        vdf.createChild(list4.getId(), nb);

        DescriptorListI duplicate
                = (DescriptorListI) vdf.duplicate(list1.getId());                 // Duplicate a root variable
        Assert.assertEquals(10.0, ((NumberDescriptor) ((DescriptorListI) ((DescriptorListI) duplicate.item(1)).item(0)).item(0)).getInstance(player).getValue());

        duplicate = (DescriptorListI) vdf.duplicate(list3.getId());             // Duplicate a sub child variable
        Assert.assertEquals(10.0, ((NumberDescriptor) ((DescriptorListI) duplicate.item(0)).item(0)).getInstance(player).getValue());

        GameModel duplicateGm = gameModelFacade.duplicateWithDebugGame(gameModel.getId());
        DescriptorListI find = (DescriptorListI) vdf.find(duplicateGm, LISTNAME1);
        Assert.assertEquals(10.0, ((NumberInstance) ((DescriptorListI) ((DescriptorListI) find.item(1)).item(0)).item(0).getScope().getVariableInstances().values().iterator().next()).getValue());
    }
}
