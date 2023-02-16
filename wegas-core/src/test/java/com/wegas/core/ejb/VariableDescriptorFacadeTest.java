/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.DescriptorListI;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.persistence.variable.primitive.*;
import com.wegas.core.persistence.variable.scope.GameModelScope;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.util.Collection;
import java.util.List;
import javax.naming.NamingException;
import org.junit.Assert;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class VariableDescriptorFacadeTest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(VariableDescriptorFacadeTest.class);

    @Test
    public void testDoubleReset() throws NamingException, WegasNoResultException {
        // Test the descriptor
        NumberDescriptor desc1 = new NumberDescriptor("x");
        desc1.setDefaultInstance(new NumberInstance(0));

        variableDescriptorFacade.create(scenario.getId(), desc1);

        gameModelFacade.reset(scenario.getId());

        variableDescriptorFacade.update(desc1.getId(), desc1);

        gameModelFacade.reset(scenario.getId());
        gameModelFacade.reset(scenario.getId());

        variableDescriptorFacade.remove(desc1.getId());
    }

    @Test
    public void testNumberDescriptor() throws NamingException, WegasNoResultException {
        final String VARIABLENAME = "test-variable";
        final String VARIABLENAME2 = "test-variable2";
        final double VAL1 = 0;
        final double VAL2 = 1;
        final double VAL3 = 2;

        // Test the descriptor
        NumberDescriptor desc1 = new NumberDescriptor(VARIABLENAME);
        desc1.setDefaultInstance(new NumberInstance(VAL1));

        NumberDescriptor desc2 = new NumberDescriptor(VARIABLENAME2);
        desc2.setDefaultInstance(new NumberInstance(VAL2));
        this.testVariableDescriptor(desc1, desc2);

        // Check its value
        NumberInstance instance = (NumberInstance) variableInstanceFacade.find(desc1.getId(), player);
        Assert.assertEquals(VAL2, instance.getValue(), 0.0001);

        // Edit the variable instance
        NumberInstance newNumberInstance = new NumberInstance(VAL3);
        newNumberInstance.setVersion(instance.getVersion());

        variableInstanceFacade.update(desc1.getId(), player.getId(), newNumberInstance);

        // Verify the new value
        instance = (NumberInstance) variableInstanceFacade.find(desc1.getId(), player.getId());
        Assert.assertEquals(VAL3, instance.getValue(), 0.0001);

        // Reset the game and test
        gameModelFacade.reset(scenario.getId());
        instance = (NumberInstance) variableInstanceFacade.find(desc1.getId(), player);
        Assert.assertEquals(VAL2, instance.getValue(), 0.0001);

        variableDescriptorFacade.remove(desc1.getId());
    }

    @Test
    public void testStringDescriptor() throws NamingException, WegasNoResultException {
        final String VARIABLENAME = "test-variable";
        final String VARIABLENAME2 = "test-variable2";
        final String VALUE1 = "test-value";
        final String VALUE2 = "test-value2";
        final String VALUE3 = "test-value3";

        // Test the descriptor
        StringDescriptor stringDescriptor = new StringDescriptor(VARIABLENAME);
        stringDescriptor.setDefaultInstance(new StringInstance());
        stringDescriptor.getDefaultInstance().setTrValue(TranslatableContent.build("en", VALUE1));

        StringDescriptor stringDescriptor2 = new StringDescriptor(VARIABLENAME2);
        stringDescriptor2.setDefaultInstance(new StringInstance());
        stringDescriptor2.getDefaultInstance().setTrValue(TranslatableContent.build("en", VALUE2));
        this.testVariableDescriptor(stringDescriptor, stringDescriptor2);

        // Check its value
        StringInstance instance = (StringInstance) variableInstanceFacade.find(stringDescriptor.getId(), player);
        Assert.assertEquals(VALUE2, instance.getValue());

        // Edit the variable instance
        StringInstance newStringInstance = new StringInstance();
        newStringInstance.setTrValue(TranslatableContent.build("en", VALUE3));
        newStringInstance.setVersion(instance.getVersion());

        variableInstanceFacade.update(stringDescriptor.getId(), player.getId(), newStringInstance);

        // Verify the new value
        instance = (StringInstance) variableInstanceFacade.find(stringDescriptor.getId(), player.getId());
        Assert.assertEquals(VALUE3, instance.getValue());

        // Reset the game and test
        gameModelFacade.reset(scenario.getId());
        instance = (StringInstance) variableInstanceFacade.find(stringDescriptor.getId(), player);
        Assert.assertEquals(VALUE2, instance.getValue());

        variableDescriptorFacade.remove(stringDescriptor.getId());
    }

    @Test
    public void testBooleanDescriptor() throws NamingException, WegasNoResultException {

        final String VARIABLENAME = "test-variable";
        final String VARIABLENAME2 = "test-variable2";

        // Test the descriptor
        BooleanDescriptor booleanDescriptor = new BooleanDescriptor(VARIABLENAME);
        booleanDescriptor.setDefaultInstance(new BooleanInstance(true));
        BooleanDescriptor booleanDescriptor2 = new BooleanDescriptor(VARIABLENAME2);
        booleanDescriptor2.setDefaultInstance(new BooleanInstance(false));
        this.testVariableDescriptor(booleanDescriptor, booleanDescriptor2);

        // Check its value
        BooleanInstance instance = (BooleanInstance) variableInstanceFacade.find(booleanDescriptor.getId(), player);
        Assert.assertEquals(false, instance.getValue());

        // Edit the variable instance
        BooleanInstance newInstance = new BooleanInstance(true);
        newInstance.setVersion(instance.getVersion());
        variableInstanceFacade.update(booleanDescriptor.getId(), player.getId(), newInstance);

        // Verify the new value
        instance = (BooleanInstance) variableInstanceFacade.find(booleanDescriptor.getId(), player.getId());
        Assert.assertEquals(true, instance.getValue());

        // Reset the game and test
        gameModelFacade.reset(scenario.getId());
        instance = (BooleanInstance) variableInstanceFacade.find(booleanDescriptor.getId(), player);
        Assert.assertEquals(false, instance.getValue());

        variableDescriptorFacade.remove(booleanDescriptor.getId());
    }

    @Test
    public void testGameModelScope() throws NamingException {

        final String VARIABLENAME = "test-variable";

        // Test the descriptor
        BooleanDescriptor desc = new BooleanDescriptor(VARIABLENAME);
        desc.setDefaultInstance(new BooleanInstance(true));
        desc.setScope(new GameModelScope());

        variableDescriptorFacade.create(scenario.getId(), desc);
        gameModelFacade.reset(scenario.getId());

        Assert.assertEquals(desc.getId(), variableInstanceFacade.find(desc.getId(), player).getParentId());

        // Check its value
        BooleanInstance instance = (BooleanInstance) variableInstanceFacade.find(desc.getId(), player);
        Assert.assertEquals(true, instance.getValue());

        // Edit the variable instance
        //variableInstanceFacade.update(desc.getId(), player.getId(), new BooleanInstance(true));
        // Verify the new value
        //instance = (BooleanInstance) variableInstanceFacade.find(desc.getId(), player.getId());
        //Assert.assertEquals(true, instance.getValue());
        // Reset the game and test
        // gameModelFacade.reset(scenario.getId());
        // instance = (BooleanInstance) variableInstanceFacade.find(desc.getId(), player);
        // Assert.assertEquals(false, instance.getValue());
        variableDescriptorFacade.remove(desc.getId());
    }

    public <T extends VariableDescriptor> T testVariableDescriptor(T descriptor1, T descriptor2)
            throws NamingException, WegasNoResultException {
        final String VARIABLENAME2 = "test-variable2";

        // Create the descriptor
        logger.info("" + descriptor1 + "*" + descriptor2);
        variableDescriptorFacade.create(scenario.getId(), descriptor1);

        gameModelFacade.reset(scenario.getId());

        // Edit this descriptor
        descriptor1 = (T) variableDescriptorFacade.find(descriptor1.getId());

        /*
         * update against up-to-date version
         */
        descriptor2.setVersion(descriptor1.getVersion());
        descriptor2.getDefaultInstance().setVersion(descriptor1.getDefaultInstance().getVersion());

        variableDescriptorFacade.update(descriptor1.getId(), descriptor2);

        // Edit this descriptor
        descriptor1 = (T) variableDescriptorFacade.find(descriptor1.getId());

        gameModelFacade.reset(scenario.getId());

        // Check edition
        T findByName = (T) variableDescriptorFacade.find(scenario, VARIABLENAME2);
        Assert.assertEquals(descriptor1.getId(), findByName.getId());
        Assert.assertEquals(descriptor2.getName(), findByName.getName());

        // Check the findByClass Function
        T findByClass = (T) variableDescriptorFacade.findByClass(scenario, descriptor1.getClass()).get(0);
        Assert.assertEquals(descriptor1.getId(), findByClass.getId());

        // Check the findByGameModel function
        Collection<T> findByRootGameModelId = (Collection<T>) variableDescriptorFacade.findAll(scenario.getId());
        Assert.assertTrue(findByRootGameModelId.contains(descriptor1));

        return descriptor1;
    }

    @Test
    public void testMove2P() throws NamingException, WegasNoResultException {
        final String VARIABLENAME = "test-variable";
        final String VARIABLENAME2 = "test-variable2";
        final double VAL1 = 0;
        final double VAL2 = 1;
        final double VAL3 = 2;

        // Test the descriptor
        NumberDescriptor desc1 = new NumberDescriptor(VARIABLENAME);
        desc1.setDefaultInstance(new NumberInstance(VAL1));

        NumberDescriptor desc2 = new NumberDescriptor(VARIABLENAME2);
        desc2.setDefaultInstance(new NumberInstance(VAL2));
        this.testVariableDescriptor(desc1, desc2);

        // Check its value
        NumberInstance instance = (NumberInstance) variableInstanceFacade.find(desc1.getId(), player);
        Assert.assertEquals(VAL2, instance.getValue(), 0.0001);

        // Edit the variable instance
        NumberInstance newInstance = new NumberInstance(VAL3);
        newInstance.setVersion(instance.getVersion());

        variableInstanceFacade.update(desc1.getId(), player.getId(), newInstance);

        // Verify the new value
        instance = (NumberInstance) variableInstanceFacade.find(desc1.getId(), player.getId());
        Assert.assertEquals(VAL3, instance.getValue(), 0.0001);

        // Reset the game and test
        gameModelFacade.reset(scenario.getId());
        instance = (NumberInstance) variableInstanceFacade.find(desc1.getId(), player);
        Assert.assertEquals(VAL2, instance.getValue(), 0.0001);

        variableDescriptorFacade.remove(desc1.getId());
    }

    @Test
    public void testMove2() throws NamingException {
        final String VARIABLENAME = "test_variable";
        final String VARIABLENAME2 = "test_variable2";
        final String VARIABLENAME3 = "test_variable3";
        final String SUBNAME1 = "test_variable4";
        final String VALUE1 = "test_value";

        GameModel gm;

        // 1st case: move from root to root
        StringDescriptor vd1 = new StringDescriptor(VARIABLENAME);
        vd1.setDefaultInstance(new StringInstance());
        vd1.getDefaultInstance().setTrValue(TranslatableContent.build("en", VALUE1));
        variableDescriptorFacade.create(scenario.getId(), vd1);

        gm = gameModelFacade.find(scenario.getId());
        Assert.assertEquals(1, gm.getChildVariableDescriptors().size());
        Assert.assertEquals(1, gm.getVariableDescriptors().size());

        //gm = gameModelFacade.find(scenario.getId());
        StringDescriptor vd2 = new StringDescriptor(VARIABLENAME2);
        vd2.setDefaultInstance(new StringInstance());
        vd2.getDefaultInstance().setTrValue(TranslatableContent.build("en", VALUE1));
        variableDescriptorFacade.create(scenario.getId(), vd2);
        gm = gameModelFacade.find(scenario.getId());
        Assert.assertEquals(2, gm.getChildVariableDescriptors().size());
        Assert.assertEquals(2, gm.getVariableDescriptors().size());

        variableDescriptorFacade.move(vd1.getId(), 1);                                               // Move first item to second position
        List<VariableDescriptor> findByGameModelId = variableDescriptorFacade.findByGameModelId(scenario.getId());// Refresh
        Assert.assertEquals(VARIABLENAME, findByGameModelId.get(1).getName());

        // 2nd case: from list to root
        ListDescriptor vd3 = new ListDescriptor(VARIABLENAME3);
        vd3.setDefaultInstance(new ListInstance());
        variableDescriptorFacade.create(scenario.getId(), vd3);
        gm = gameModelFacade.find(scenario.getId());
        Assert.assertEquals(3, gm.getChildVariableDescriptors().size());
        Assert.assertEquals(3, gm.getVariableDescriptors().size());

        StringDescriptor sub1 = new StringDescriptor(SUBNAME1);
        sub1.setDefaultInstance(new StringInstance());
        sub1.getDefaultInstance().setTrValue(TranslatableContent.build("en", VALUE1));
        variableDescriptorFacade.createChild(vd3.getId(), sub1);
        gm = gameModelFacade.find(scenario.getId());
        // The last one in not at root level:
        Assert.assertEquals(3, gm.getChildVariableDescriptors().size());
        Assert.assertEquals(4, gm.getVariableDescriptors().size());

        findByGameModelId = variableDescriptorFacade.findByGameModelId(scenario.getId());           // Refresh
        Assert.assertEquals(SUBNAME1, ((ListDescriptor) findByGameModelId.get(2)).item(0).getName());

        variableDescriptorFacade.move(sub1.getId(), 0);                                              // Move at first position
        gm = gameModelFacade.find(scenario.getId());
        // now, it is:
        Assert.assertEquals(4, gm.getChildVariableDescriptors().size());
        Assert.assertEquals(4, gm.getVariableDescriptors().size());

        findByGameModelId = variableDescriptorFacade.findByGameModelId(scenario.getId());           // Refresh
        Assert.assertEquals(SUBNAME1, findByGameModelId.get(0).getName());
        Assert.assertEquals(0, ((ListDescriptor) findByGameModelId.get(3)).size());

        variableDescriptorFacade.remove(vd1.getId());
        gm = gameModelFacade.find(scenario.getId());
        Assert.assertEquals(3, gm.getVariableDescriptors().size());
        Assert.assertEquals(3, gm.getChildVariableDescriptors().size());
        variableDescriptorFacade.remove(vd2.getId());
        gm = gameModelFacade.find(scenario.getId());
        Assert.assertEquals(2, gm.getVariableDescriptors().size());
        Assert.assertEquals(2, gm.getChildVariableDescriptors().size());
        variableDescriptorFacade.remove(vd3.getId());
        gm = gameModelFacade.find(scenario.getId());
        Assert.assertEquals(1, gm.getVariableDescriptors().size());
        Assert.assertEquals(1, gm.getChildVariableDescriptors().size());
        variableDescriptorFacade.remove(sub1.getId());
        gm = gameModelFacade.find(scenario.getId());
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

        GameModel gm;

        // 1st case: move from descriptor to descriptor
        ListDescriptor list1 = new ListDescriptor(LISTNAME1);
        list1.setDefaultInstance(new ListInstance());
        variableDescriptorFacade.create(scenario.getId(), list1);
        gm = gameModelFacade.find(scenario.getId());
        Assert.assertEquals(1, gm.getVariableDescriptors().size());
        Assert.assertEquals(1, gm.getChildVariableDescriptors().size());

        StringDescriptor vd1 = new StringDescriptor(VARIABLENAME1);
        vd1.setDefaultInstance(new StringInstance());
        vd1.getDefaultInstance().setTrValue(TranslatableContent.build("en", VALUE1));
        variableDescriptorFacade.createChild(list1.getId(), vd1);
        gm = gameModelFacade.find(scenario.getId());
        Assert.assertEquals(2, gm.getVariableDescriptors().size());
        Assert.assertEquals(1, gm.getChildVariableDescriptors().size());

        StringDescriptor vd2 = new StringDescriptor(VARIABLENAME2);
        vd2.setDefaultInstance(new StringInstance());
        vd2.getDefaultInstance().setTrValue(TranslatableContent.build("en", VALUE1));
        variableDescriptorFacade.createChild(list1.getId(), vd2);
        List<VariableDescriptor> childrenDescriptors = variableDescriptorFacade.findByGameModelId(scenario.getId());
        Assert.assertEquals(VARIABLENAME1, ((ListDescriptor) childrenDescriptors.get(0)).item(0).getName());// Check if item was successfully added
        gm = gameModelFacade.find(scenario.getId());
        Assert.assertEquals(3, gm.getVariableDescriptors().size());
        Assert.assertEquals(1, gm.getChildVariableDescriptors().size());

        variableDescriptorFacade.move(vd1.getId(), list1.getId(), 1);                                // Move first item to second position
        childrenDescriptors = variableDescriptorFacade.findByGameModelId(scenario.getId());         // Refresh
        Assert.assertEquals(VARIABLENAME2, ((ListDescriptor) childrenDescriptors.get(0)).item(0).getName());

        // 2nd case: from root to descriptor
        StringDescriptor vd3 = new StringDescriptor(VARIABLENAME3);
        vd3.setDefaultInstance(new StringInstance());
        vd3.getDefaultInstance().setTrValue(TranslatableContent.build("en", VALUE1));
        variableDescriptorFacade.create(scenario.getId(), vd3);

        variableDescriptorFacade.move(vd3.getId(), list1.getId(), 0);                                // Move first item to index 0
        childrenDescriptors = variableDescriptorFacade.findByGameModelId(scenario.getId());         // Refresh
        Assert.assertEquals(VARIABLENAME3, ((ListDescriptor) childrenDescriptors.get(0)).item(0).getName());
        Assert.assertEquals(1, childrenDescriptors.size());

        // 3rd case: from one descriptor to another
        ListDescriptor list2 = new ListDescriptor(LISTNAME2);
        list2.setDefaultInstance(new ListInstance());
        variableDescriptorFacade.create(scenario.getId(), list2);

        variableDescriptorFacade.move(vd3.getId(), list2.getId(), 0);                                // Move first item to index 0
        childrenDescriptors = variableDescriptorFacade.findByGameModelId(scenario.getId());         // Refresh
        Assert.assertEquals(VARIABLENAME3, ((ListDescriptor) childrenDescriptors.get(1)).item(0).getName());
        Assert.assertEquals(2, ((ListDescriptor) childrenDescriptors.get(0)).size());

        variableDescriptorFacade.remove(vd1.getId());                                                // Clean up
        variableDescriptorFacade.remove(vd2.getId());
        variableDescriptorFacade.remove(vd3.getId());
        variableDescriptorFacade.remove(list1.getId());
        variableDescriptorFacade.remove(list2.getId());
    }

    @Test
    public void testListDuplicate() throws NamingException, CloneNotSupportedException, WegasNoResultException {
        final String VARIABLENAME1 = "test_variable";
        final String LISTNAME1 = "list1";
        final String LISTNAME2 = "list2";
        final String LISTNAME3 = "list3";
        final String LISTNAME4 = "list4";

        ListDescriptor list1 = new ListDescriptor(LISTNAME1);
        list1.setDefaultInstance(new ListInstance());
        variableDescriptorFacade.create(scenario.getId(), list1);

        ListDescriptor list2 = new ListDescriptor(LISTNAME2);
        list2.setDefaultInstance(new ListInstance());
        variableDescriptorFacade.createChild(list1.getId(), list2);

        ListDescriptor list3 = new ListDescriptor(LISTNAME3);
        list3.setDefaultInstance(new ListInstance());
        variableDescriptorFacade.createChild(list1.getId(), list3);

        ListDescriptor list4 = new ListDescriptor(LISTNAME4);
        list4.setDefaultInstance(new ListInstance());
        variableDescriptorFacade.createChild(list3.getId(), list4);

        NumberDescriptor nb = new NumberDescriptor(VARIABLENAME1);
        nb.setDefaultInstance(new NumberInstance(10));

        variableDescriptorFacade.createChild(list4.getId(), nb);

        DescriptorListI duplicate
                = (DescriptorListI) variableDescriptorFacade.duplicate(list1.getId());                 // Duplicate a root variable
        Assert.assertEquals(10.0, ((NumberDescriptor) ((DescriptorListI) ((DescriptorListI) duplicate.item(1)).item(0)).item(0)).getInstance(player).getValue(), 0.0001);

        duplicate = (DescriptorListI) variableDescriptorFacade.duplicate(list3.getId());             // Duplicate a sub child variable
        Assert.assertEquals(10.0, ((NumberDescriptor) ((DescriptorListI) duplicate.item(0)).item(0)).getInstance(player).getValue(), 0.0001);

        GameModel duplicateGm = gameModelFacade.createScenarioWithDebugGame(scenario.getId());
        DescriptorListI find = (DescriptorListI) variableDescriptorFacade.find(duplicateGm, LISTNAME1);

        Collection<VariableInstance> instances = variableDescriptorFacade.getInstances(((DescriptorListI) ((DescriptorListI) find.item(1)).item(0)).item(0)).values();
        Assert.assertEquals(10.0, ((NumberInstance) instances.iterator().next()).getValue(), 0.0001);
    }
}
