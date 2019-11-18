/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.ejb;

import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.Script;
import com.wegas.resourceManagement.persistence.Activity;
import com.wegas.resourceManagement.persistence.Assignment;
import com.wegas.resourceManagement.persistence.BurndownDescriptor;
import com.wegas.resourceManagement.persistence.BurndownInstance;
import com.wegas.resourceManagement.persistence.Iteration;
import com.wegas.resourceManagement.persistence.Occupation;
import com.wegas.resourceManagement.persistence.ResourceDescriptor;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.resourceManagement.persistence.WRequirement;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import javax.inject.Inject;
import org.junit.Assert;
import static org.junit.Assert.*;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com), Benjamin Gerber
 * <ger.benjamin@gmail.com>
 */
public class ResourceFacadeTest extends AbstractArquillianTest {

    static final private Logger logger = LoggerFactory.getLogger(ResourceFacade.class);

    @Inject
    private ResourceFacade resourceFacade;

    @Inject
    private IterationFacade iterationFacade;

    @Test
    public void testAssignmentsCascadeFromTaskDescriptor() throws Exception {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // Create a task1
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel(TranslatableContent.build("en", "My task"));
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task);

        resourceFacade.assign(res.getInstance(player).getId(), task.getInstance(player).getId());

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getAssignments().get(0).getTaskInstance(),
                task.getInstance(player));

        assertEquals(
                ((TaskDescriptor) variableDescriptorFacade.find(task.getId())).getInstance(player).getAssignments().get(0).getResourceInstance(),
                res.getInstance(player));

        variableDescriptorFacade.remove(task.getId());

        /*assertTrue("Resource assignments not empty", 
            ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getAssignments().isEmpty());*/
        // Clean
        variableDescriptorFacade.remove(res.getId());
    }

    /**
     * Test of assign method, of class ResourceFacade.
     */
    @Test
    public void testAssign_ResourceInstance_TaskInstance() throws Exception {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // Create a task1
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel(TranslatableContent.build("en", "My task"));
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task);

        resourceFacade.assign(res.getInstance(player).getId(), task.getInstance(player).getId());

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getAssignments().get(0).getTaskInstance(),
                task.getInstance(player));

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task.getId());
    }

    /**
     * Test of assign method, of class ResourceFacade.
     */
    @Test
    public void testAssignment() {
        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // Create a task1
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel(TranslatableContent.build("en", "My task"));
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task);

        // Assign resource to task1
        resourceFacade.assign(res.getInstance(player).getId(), task.getInstance(player).getId());

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getAssignments().get(0).getTaskInstance(),
                task.getInstance(player));

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task.getId());
    }

    /**
     * Test of assign method, of class ResourceFacade.
     */
    @Test
    public void testMergeAssignmentsOrder() {
        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // Create a task1
        TaskDescriptor task1 = new TaskDescriptor();
        task1.setLabel(TranslatableContent.build("en", "My task"));
        task1.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task1);

        // Create a task1
        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel(TranslatableContent.build("en", "My second task"));
        task2.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task2);

        // Create a task3
        TaskDescriptor task3 = new TaskDescriptor();
        task3.setLabel(TranslatableContent.build("en", "My third task"));
        task3.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task3);

        // Assign default resource to task 1 2 and 3
        resourceFacade.assign(res.getDefaultInstance().getId(), task1.getDefaultInstance().getId());
        resourceFacade.assign(res.getDefaultInstance().getId(), task2.getDefaultInstance().getId());
        resourceFacade.assign(res.getDefaultInstance().getId(), task3.getDefaultInstance().getId());

        gameModelFacade.reset(scenario.getId());

        ResourceInstance resI = (ResourceInstance) variableInstanceFacade.find(res.getId(), player);
        TaskInstance t1 = (TaskInstance) variableInstanceFacade.find(task1.getId(), player);
        TaskInstance t2 = (TaskInstance) variableInstanceFacade.find(task2.getId(), player);
        TaskInstance t3 = (TaskInstance) variableInstanceFacade.find(task3.getId(), player);

        assertEquals(resI.getAssignments().get(0).getTaskInstance(), t1);
        assertEquals(resI.getAssignments().get(1).getTaskInstance(), t2);
        assertEquals(resI.getAssignments().get(2).getTaskInstance(), t3);

        res = (ResourceDescriptor) variableDescriptorFacade.find(res.getId());
        // 1 2 3 -> 2 3 1
        resourceFacade.moveAssignment(res.getDefaultInstance().getAssignments().get(0).getId(), 2);

        gameModelFacade.reset(scenario.getId());

        resI = (ResourceInstance) variableInstanceFacade.find(res.getId(), player);

        assertEquals(resI.getAssignments().get(0).getTaskInstance(), t2);
        assertEquals(resI.getAssignments().get(1).getTaskInstance(), t3);
        assertEquals(resI.getAssignments().get(2).getTaskInstance(), t1);

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task1.getId());
        variableDescriptorFacade.remove(task2.getId());
        variableDescriptorFacade.remove(task3.getId());
    }

    /**
     * Remove Assignment Test
     */
    @Test
    public void testRemoveAssignment() {
        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // Create a task1
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel(TranslatableContent.build("en", "My task"));
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task);

        // Assign resource to task1
        resourceFacade.assign(res.getInstance(player).getId(), task.getInstance(player).getId());

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getAssignments().get(0).getTaskInstance(),
                task.getInstance(player));

        Assignment assignment = resourceFacade.findAssignment(res.getInstance(player).getId(), task.getInstance(player).getId());
        resourceFacade.removeAssignment(assignment.getId());

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task.getId());
    }

    /**
     * Remove Assignment Test
     */
    @Test
    public void testMergeAssignment_Add() {
        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // Create a task1
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel(TranslatableContent.build("en", "My task"));
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task);


        /*
         * Setup default instances
         */
        ResourceInstance defaultInstance = res.getDefaultInstance();
        Assignment assignment = new Assignment();
        assignment.setResourceInstance(defaultInstance);
        assignment.setTaskInstance(task.getDefaultInstance());
        defaultInstance.addAssignment(assignment);

        variableDescriptorFacade.update(res.getId(), res);

        task = (TaskDescriptor) variableDescriptorFacade.find(task.getId());
        res = (ResourceDescriptor) variableDescriptorFacade.find(res.getId());

        Assert.assertEquals(1, task.getDefaultInstance().getAssignments().size());
        Assert.assertEquals(1, res.getDefaultInstance().getAssignments().size());

        /**
         * Reset and propagate to players
         */
        gameModelFacade.reset(scenario.getId());

        Assert.assertEquals(1, task.getInstance(player).getAssignments().size());
        Assert.assertEquals(1, res.getInstance(player).getAssignments().size());

        // Remove assignment
        defaultInstance = res.getDefaultInstance();
        defaultInstance.getAssignments().remove(0);

        variableDescriptorFacade.update(res.getId(), res);

        task = (TaskDescriptor) variableDescriptorFacade.find(task.getId());
        res = (ResourceDescriptor) variableDescriptorFacade.find(res.getId());

        Assert.assertEquals(0, task.getDefaultInstance().getAssignments().size());
        Assert.assertEquals(0, res.getDefaultInstance().getAssignments().size());

        /**
         * Reset and propagate to players
         */
        gameModelFacade.reset(scenario.getId());

        Assert.assertEquals(0, task.getInstance(player).getAssignments().size());
        Assert.assertEquals(0, res.getInstance(player).getAssignments().size());
    }

    /**
     * Remove Assignment Test
     */
    @Test
    public void testRemoveTask() {
        BurndownDescriptor bdown = new BurndownDescriptor();
        bdown.setDefaultInstance(new BurndownInstance());
        variableDescriptorFacade.create(scenario.getId(), bdown);

        // Create a resource
        ResourceDescriptor paulD = new ResourceDescriptor();
        paulD.setLabel(TranslatableContent.build("en", "Paul"));
        paulD.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), paulD);

        // Create a resource
        ResourceDescriptor rogerD = new ResourceDescriptor();
        rogerD.setLabel(TranslatableContent.build("en", "Roger"));
        rogerD.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), rogerD);

        // Create tasks
        TaskDescriptor task1 = new TaskDescriptor();
        task1.setLabel(TranslatableContent.build("en", "My task"));
        task1.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task1);

        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel(TranslatableContent.build("en", "My second task"));
        task2.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task2);

        Iteration it1 = new Iteration();

        /**
         * Load player instances
         */
        BurndownInstance bdi1 = bdown.getInstance(player);
        TaskInstance task1Ip = task1.getInstance(player);
        TaskInstance task2Ip = task2.getInstance(player);

        ResourceInstance rogerIp = rogerD.getInstance(player);
        ResourceInstance paulIp = paulD.getInstance(player);

        /*
         * Add tasks to iteration (task1 + task2)
         */
        iterationFacade.addIteration(bdi1.getId(), it1);
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        iterationFacade.addTaskToIteration(task1Ip.getId(), bdi1.getIterations().get(0).getId(), 10, 0, 1000, 1000);
        iterationFacade.addTaskToIteration(task2Ip.getId(), bdi1.getIterations().get(0).getId(), 10, 0, 1000, 1000);

        /*
         * Assign paul to tasks
         */
        resourceFacade.assign(paulIp.getId(), task1Ip.getId());
        resourceFacade.assign(paulIp.getId(), task2Ip.getId());

        /*
         * Create activity for Roger
         */
        resourceFacade.createActivity(rogerIp.getId(), task1Ip.getId());
        resourceFacade.createActivity(rogerIp.getId(), task2Ip.getId());

        /*
         * Reload instances
         */
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId());
        paulIp = (ResourceInstance) variableInstanceFacade.find(paulIp.getId());
        rogerIp = (ResourceInstance) variableInstanceFacade.find(rogerIp.getId());
        task1Ip = (TaskInstance) variableInstanceFacade.find(task1Ip.getId());
        task2Ip = (TaskInstance) variableInstanceFacade.find(task2Ip.getId());

        /**
         * assert initial situation
         */
        Assert.assertEquals(2, bdi1.getIterations().get(0).getTasks().size());
        Assert.assertTrue(bdi1.getIterations().get(0).getTasks().contains(task1Ip));
        Assert.assertTrue(bdi1.getIterations().get(0).getTasks().contains(task2Ip));

        Assert.assertEquals(2, paulIp.getAssignments().size());
        Assert.assertEquals(task1Ip, paulIp.getAssignments().get(0).getTaskInstance());
        Assert.assertEquals(task2Ip, paulIp.getAssignments().get(1).getTaskInstance());

        Assert.assertEquals(2, rogerIp.getActivities().size());
        Assert.assertEquals(task1Ip, rogerIp.getActivities().get(0).getTaskInstance());
        Assert.assertEquals(task2Ip, rogerIp.getActivities().get(1).getTaskInstance());

        Assert.assertEquals(1, task1Ip.getAssignments().size());
        Assert.assertEquals(paulIp, task1Ip.getAssignments().get(0).getResourceInstance());

        Assert.assertEquals(1, task1Ip.getActivities().size());
        Assert.assertEquals(rogerIp, task1Ip.getActivities().get(0).getResourceInstance());

        Assert.assertEquals(1, task2Ip.getAssignments().size());
        Assert.assertEquals(paulIp, task2Ip.getAssignments().get(0).getResourceInstance());

        Assert.assertEquals(1, task2Ip.getActivities().size());
        Assert.assertEquals(rogerIp, task2Ip.getActivities().get(0).getResourceInstance());

        Assert.assertEquals(1, task1Ip.getIterations().size());
        Assert.assertEquals(bdi1.getIterations().get(0), task1Ip.getIterations().get(0));

        Assert.assertEquals(1, task2Ip.getIterations().size());
        Assert.assertEquals(bdi1.getIterations().get(0), task2Ip.getIterations().get(0));

        /*
         * Delete task2
         */
variableDescriptorFacade.remove(task2.getId());


        /*
         * Reload instances
         */
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId());
        paulIp = (ResourceInstance) variableInstanceFacade.find(paulIp.getId());
        rogerIp = (ResourceInstance) variableInstanceFacade.find(rogerIp.getId());
        task1Ip = (TaskInstance) variableInstanceFacade.find(task1Ip.getId());

        /**
         * assert initial situation
         */
        Assert.assertEquals(1, bdi1.getIterations().get(0).getTasks().size());
        Assert.assertTrue(bdi1.getIterations().get(0).getTasks().contains(task1Ip));

        Assert.assertEquals(1, paulIp.getAssignments().size());
        Assert.assertEquals(task1Ip, paulIp.getAssignments().get(0).getTaskInstance());

        Assert.assertEquals(1, rogerIp.getActivities().size());
        Assert.assertEquals(task1Ip, rogerIp.getActivities().get(0).getTaskInstance());

        Assert.assertEquals(1, task1Ip.getAssignments().size());
        Assert.assertEquals(paulIp, task1Ip.getAssignments().get(0).getResourceInstance());

        Assert.assertEquals(1, task1Ip.getActivities().size());
        Assert.assertEquals(rogerIp, task1Ip.getActivities().get(0).getResourceInstance());

        Assert.assertEquals(1, task1Ip.getIterations().size());
        Assert.assertEquals(bdi1.getIterations().get(0), task1Ip.getIterations().get(0));
    }

    /**
     * Remove Assignment Test
     */
    @Test
    public void testMergeIterations() {
        BurndownDescriptor bdown = new BurndownDescriptor();
        bdown.setDefaultInstance(new BurndownInstance());
        variableDescriptorFacade.create(scenario.getId(), bdown);

        // Create tasks
        TaskDescriptor task1 = new TaskDescriptor();
        task1.setLabel(TranslatableContent.build("en", "My task"));
        task1.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task1);

        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel(TranslatableContent.build("en", "My second task"));
        task2.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task2);

        Iteration it1 = new Iteration();

        BurndownInstance bdiDef = bdown.getDefaultInstance();
        BurndownInstance bdi1 = bdown.getInstance(player);

        /*
         * Add empty iteration
         */
        iterationFacade.addIteration(bdiDef.getId(), it1);
        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        Assert.assertEquals(1, bdiDef.getIterations().size());
        Assert.assertEquals(0, bdi1.getIterations().size());  // not reset yet

        /*
         * propagate to players
         */
        gameModelFacade.reset(scenario.getId());
        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        Assert.assertEquals(1, bdiDef.getIterations().size());
        Assert.assertEquals(1, bdi1.getIterations().size());

        Assert.assertFalse(bdiDef.getIterations().get(0).equals(bdi1.getIterations().get(0)));

        /*
         * add task1 to iteration1
         */
        iterationFacade.addTaskToIteration(task1.getDefaultInstance().getId(), bdiDef.getIterations().get(0).getId(), 10, 0, 1000, 1000);

        // reload
        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        // assert iteration1 task(s)
        Assert.assertEquals(1, bdiDef.getIterations().get(0).getTasks().size());
        Assert.assertEquals(0, bdi1.getIterations().get(0).getTasks().size());

        Assert.assertEquals(task1.getDefaultInstance(), bdiDef.getIterations().get(0).getTasks().get(0));

        /*
         * propagation iteration task(s) to player(s)
         */
        gameModelFacade.reset(scenario.getId());

        // reload
        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        // assert iteration1 task(s)
        Assert.assertEquals(1, bdiDef.getIterations().get(0).getTasks().size());
        Assert.assertEquals(1, bdi1.getIterations().get(0).getTasks().size());

        // Assert taskinstances belong to correct players
        Assert.assertEquals(task1.getDefaultInstance(), bdiDef.getIterations().get(0).getTasks().get(0));
        Assert.assertEquals(task1.getInstance(player), bdi1.getIterations().get(0).getTasks().get(0));

        /*
         * Player update his own iteration
         */
        iterationFacade.addTaskToIteration(task2.getInstance(player).getId(), bdi1.getIterations().get(0).getId(), 10, 0, 1000, 1000);

        // reload
        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        // assert iteration1 task(s)
        Assert.assertEquals(1, bdiDef.getIterations().get(0).getTasks().size());
        Assert.assertEquals(2, bdi1.getIterations().get(0).getTasks().size());

        Assert.assertTrue(bdi1.getIterations().get(0).getTasks().contains(task1.getInstance(player)));
        Assert.assertTrue(bdi1.getIterations().get(0).getTasks().contains(task2.getInstance(player)));

        /*
         * erase player modification
         */
        gameModelFacade.reset(scenario.getId());

        // reload
        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        // assert iteration1 task(s)
        Assert.assertEquals(1, bdiDef.getIterations().get(0).getTasks().size());
        Assert.assertEquals(1, bdi1.getIterations().get(0).getTasks().size());

        // Assert taskinstances belong to correct players
        Assert.assertEquals(task1.getDefaultInstance(), bdiDef.getIterations().get(0).getTasks().get(0));
        Assert.assertEquals(task1.getInstance(player), bdi1.getIterations().get(0).getTasks().get(0));

        /**
         * remove all tasks
         */
        iterationFacade.removeTaskFromIteration(task1.getDefaultInstance().getId(), bdiDef.getIterations().get(0).getId(), 10, 0, 1000, 1000);

        // reload
        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        // assert iteration1 task(s)
        Assert.assertEquals(0, bdiDef.getIterations().get(0).getTasks().size());
        Assert.assertEquals(1, bdi1.getIterations().get(0).getTasks().size());

        /*
         * erase player modification
         */
        gameModelFacade.reset(scenario.getId());

        // reload
        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        // assert iteration1 task(s)
        Assert.assertEquals(0, bdiDef.getIterations().get(0).getTasks().size());
        Assert.assertEquals(0, bdi1.getIterations().get(0).getTasks().size());

        /* 
         * remove iteration (player)
         */
        iterationFacade.removeIteration(bdi1.getIterations().get(0).getId());

        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        Assert.assertEquals(1, bdiDef.getIterations().size());
        Assert.assertEquals(0, bdi1.getIterations().size());  // not reset yet

        /*
         * erase player modification
         */
        gameModelFacade.reset(scenario.getId());

        // reload
        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        Assert.assertEquals(1, bdiDef.getIterations().size());
        Assert.assertEquals(1, bdi1.getIterations().size());

        /* 
         * remove iteration (default)
         */
        iterationFacade.removeIteration(bdiDef.getIterations().get(0).getId());

        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        Assert.assertEquals(0, bdiDef.getIterations().size());
        Assert.assertEquals(1, bdi1.getIterations().size());  // not reset yet

        /*
         * erase player modification
         */
        gameModelFacade.reset(scenario.getId());

        // reload
        bdiDef = (BurndownInstance) variableInstanceFacade.find(bdiDef.getId()); //reload defaultInstance
        bdi1 = (BurndownInstance) variableInstanceFacade.find(bdi1.getId()); // reload player instance

        Assert.assertEquals(0, bdiDef.getIterations().size());
        Assert.assertEquals(0, bdi1.getIterations().size());
    }

    /**
     * Remove Assignment Test. Script eval version
     */
    @Test
    public void testRemoveAssignmentFromScript() {
        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setName("paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // Create a task1
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel(TranslatableContent.build("en", "task"));
        task.setName("task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task);
        String script = "var paul = Variable.find(gameModel, \"paul\");\n"
                + "var paulI = paul.getInstance(self);\n"
                + "var task = Variable.find(gameModel, \"task\");\n"
                + "var taskI = task.getInstance(self);\n"
                + "ResourceFacade.assign(paulI.getId(), taskI.getId());\n";

        scriptFacade.eval(player, new Script("javascript", script), null); //

        String script2 = "var paul = Variable.find(gameModel, \"paul\");\n"
                + "var paulI = paul.getInstance(self);\n"
                + "var task = Variable.find(gameModel, \"task\");\n"
                + "var taskI = task.getInstance(self);\n"
                + "ResourceFacade.removeAssignment(ResourceFacade.findAssignment(paulI.getId(), taskI.getId()).getId());\n";

        scriptFacade.eval(player, new Script("javascript", script2), null);

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task.getId());
    }

    /**
     * Test of createActivity method, of class ResourceFacade.
     */
    @Test
    public void testCreateActivity_ResourceInstance_TaskDescriptor() {

        // Create a resource
        ResourceDescriptor resD = new ResourceDescriptor();
        resD.setLabel(TranslatableContent.build("en", "Paul"));
        resD.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), resD);

        // Create a task1
        TaskDescriptor taskD = new TaskDescriptor();
        taskD.setLabel(TranslatableContent.build("en", "My task"));
        taskD.setDefaultInstance(new TaskInstance());
        WRequirement req = new WRequirement();
        req.setWork("carpenter");
        taskD.getDefaultInstance().addRequirement(req);
        variableDescriptorFacade.create(scenario.getId(), taskD);

        ResourceInstance resource = resD.getDefaultInstance();
        TaskInstance task = taskD.getDefaultInstance();

        // Create default activity between resource to task1
        Activity activity = resourceFacade.createActivity(resource.getId(), task.getId());
        req = resourceFacade.findRequirement(req.getId());
        resourceFacade.changeActivityReq(activity.getId(), req.getId());

        resource = (ResourceInstance) variableInstanceFacade.find(resource.getId());
        task = (TaskInstance) variableInstanceFacade.find(task.getId());

        Assert.assertEquals(1, resource.getActivities().size());
        Assert.assertEquals(1, task.getRequirements().size());
        Assert.assertEquals(1, task.getActivities().size());
        Assert.assertEquals(req, task.getActivities().get(0).getRequirement());

        /**
         * Reset and propagate to players
         */
        gameModelFacade.reset(scenario.getId());

        taskD = (TaskDescriptor) variableDescriptorFacade.find(taskD.getId());
        resD = (ResourceDescriptor) variableDescriptorFacade.find(resD.getId());

        Assert.assertEquals(1, taskD.getInstance(player).getActivities().size());
        Assert.assertEquals(1, taskD.getInstance(player).getRequirements().size());
        Assert.assertEquals(1, resD.getInstance(player).getActivities().size());
        Assert.assertFalse(taskD.getInstance(player).getRequirements().get(0).equals(req));
        Assert.assertEquals(taskD.getInstance(player).getRequirements().get(0), resD.getInstance(player).getActivities().get(0).getRequirement());

        Assert.assertEquals(1, taskD.getDefaultInstance().getActivities().size());
        Assert.assertEquals(1, resD.getDefaultInstance().getActivities().size());
        Assert.assertEquals(1, taskD.getDefaultInstance().getRequirements().size());
        Assert.assertEquals(req, taskD.getDefaultInstance().getActivities().get(0).getRequirement());

        // Remove activity
        resource = resD.getDefaultInstance();
        resource.getActivities().remove(0);

        //update gameModel
        variableDescriptorFacade.update(resD.getId(), resD);

        taskD = (TaskDescriptor) variableDescriptorFacade.find(taskD.getId());
        resD = (ResourceDescriptor) variableDescriptorFacade.find(resD.getId());

        Assert.assertEquals(0, taskD.getDefaultInstance().getActivities().size());
        Assert.assertEquals(0, resD.getDefaultInstance().getActivities().size());

        /**
         * Reset and propagate to players
         */
        gameModelFacade.reset(scenario.getId());

        Assert.assertEquals(0, taskD.getInstance(player).getActivities().size());
        Assert.assertEquals(0, resD.getInstance(player).getActivities().size());

        variableDescriptorFacade.remove(resD.getId());
        variableDescriptorFacade.remove(taskD.getId());
    }

    /**
     * Test of createActivity method, of class ResourceFacade.
     */
    @Test
    public void testCreateActivity() {
        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // Create a task1
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel(TranslatableContent.build("en", "My task"));
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task);

        // Assign activity between resource to task1
        resourceFacade.createActivity(res.getInstance(player).getId(), task.getInstance(player).getId());

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getActivities().get(0).getTaskInstance(),
                task.getInstance(player));

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task.getId());
    }

    /**
     * Test of addOccupation method, of class ResourceFacade.
     */
    @Test
    public void testAddOccupation_ResourceInstance() throws Exception {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // Add occupation to a resource
        resourceFacade.addOccupation(res.getInstance(player).getId(), false, 1);

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getOccupations().get(0).getResourceInstance(),
                res.getInstance(player));

        // Clean
        variableDescriptorFacade.remove(res.getId());
    }

    /**
     * Test of addOccupation method, of class ResourceFacade.
     */
    @Test
    public void testAddOccupation() {
        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // add occupation between to a resource
        resourceFacade.addOccupation(res.getInstance(player).getId(), true, 1);

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getOccupations().get(0).getResourceInstance(),
                res.getInstance(player));

        // Clean
        variableDescriptorFacade.remove(res.getId());
    }

    /**
     * Test of addOccupation method, of class ResourceFacade.
     *
     * @throws java.lang.Exception
     */
    @Test
    public void testAddOccupation2() throws Exception {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // Add occupation to a resource
        resourceFacade.addOccupation(res.getInstance(player).getId(), false, 1);

        Occupation newOccupation = ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getOccupations().get(0);

        // Check resource instance has been correctly setted 
        assertEquals(newOccupation.getResourceInstance(), res.getInstance(player));

        // Check the editiable occupation mode
        assertEquals(false, newOccupation.getEditable());

        // Check the occupation time
        assertEquals(1.0, newOccupation.getTime(), 0.00001);

        // Clean
        variableDescriptorFacade.remove(res.getId());
    }

    /**
     * Test ResourceFacade.addReservation
     * <p>
     */
    @Test
    public void testAddReservation() {
        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // reserve Paul for the 1.0 period
        resourceFacade.addOccupation(res.getInstance(player).getId(), true, 1);

        Occupation newOccupation = ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getOccupations().get(0);
        // Check resource instance has been correctly setted 
        assertEquals(newOccupation.getResourceInstance(), res.getInstance(player));
        // Check the editiable occupation mode
        assertEquals(true, newOccupation.getEditable());

        // Clean
        variableDescriptorFacade.remove(res.getId());
    }

    /**
     * Test of moveAssignment method, of class ResourceFacade.
     */
    @Test
    public void testMoveAssignment() {
        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel(TranslatableContent.build("en", "Paul"));
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), res);

        // Create a task1
        TaskDescriptor task1 = new TaskDescriptor();
        task1.setLabel(TranslatableContent.build("en", "My task"));
        task1.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task1);

        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel(TranslatableContent.build("en", "My task"));
        task2.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task2);

        TaskDescriptor task3 = new TaskDescriptor();
        task3.setLabel(TranslatableContent.build("en", "My task"));
        task3.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task3);

        // Assign resource to task1
        resourceFacade.assign(res.getInstance(player).getId(), task1.getInstance(player).getId());
        resourceFacade.assign(res.getInstance(player).getId(), task2.getInstance(player).getId());
        Assignment assignment = resourceFacade.assign(res.getInstance(player).getId(), task3.getInstance(player).getId());

        //Move last assignement (pos 2) at pos (0)
        resourceFacade.moveAssignment(assignment.getId(), 0);

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getAssignments().get(0).getId(),
                assignment.getId());

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task1.getId());
        variableDescriptorFacade.remove(task2.getId());
        variableDescriptorFacade.remove(task3.getId());
    }

    /**
     * Test of requirements methods, of class resourceInstance
     */
    @Test
    public void testAddRequirements() {
        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel(TranslatableContent.build("en", "My task"));
        TaskInstance taskInstance = new TaskInstance();
        task.setDefaultInstance(taskInstance);

        //assign new requirement in task
        WRequirement requirement = new WRequirement();
        requirement.setLimit(100);
        requirement.setLevel(58);
        requirement.setQuantity(1L);
        requirement.setWork("Carpenter");
        taskInstance.addRequirement(requirement);

        variableDescriptorFacade.create(scenario.getId(), task);

        //test on work variable because if it match, requierements work.
        assertEquals(((TaskInstance) variableInstanceFacade.find(task.getInstance(player).getId())).getRequirements().get(0).getWork(),
                requirement.getWork());

        // Clean
        variableDescriptorFacade.remove(task.getId());
    }

    @Test
    public void testDuplicateTaskDescriptor() throws Exception {
        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel(TranslatableContent.build("en", "My task"));
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task);

        // Create a second task
        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel(TranslatableContent.build("en", "My task2"));
        TaskInstance taskInstance = new TaskInstance();
        ArrayList<WRequirement> requirements = new ArrayList<>();
        requirements.add(new WRequirement("engineer"));
        taskInstance.setRequirements(requirements);
        task2.setDefaultInstance(taskInstance);
        task2.addPredecessor(task);
        variableDescriptorFacade.create(scenario.getId(), task2);
        assertEquals("engineer", task2.getDefaultInstance().getRequirements().get(0).getWork());

        // and duplicate it
        TaskDescriptor duplicate = (TaskDescriptor) variableDescriptorFacade.duplicate(task2.getId());
        assertEquals("engineer", duplicate.getDefaultInstance().getRequirements().get(0).getWork());
        assertEquals("My task", duplicate.getPredecessor(0).getLabel().translateOrEmpty(scenario));

        // Clean
        variableDescriptorFacade.remove(task.getId());
        variableDescriptorFacade.remove(task2.getId());
    }

    @Test
    public void testAddPredecessors() throws Exception {

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel(TranslatableContent.build("en", "My task"));
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task);

        // Create a second task
        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel(TranslatableContent.build("en", "My task2"));
        task2.setDefaultInstance(new TaskInstance());
        task2.addPredecessor(task);
        variableDescriptorFacade.create(scenario.getId(), task2);

        TaskDescriptor created = (TaskDescriptor) variableDescriptorFacade.find(task2.getId());
        assertEquals("My task", created.getPredecessor(0).getLabel().translateOrEmpty(scenario));
        assertEquals(1, created.getPredecessors().size());

        // Create a task
        TaskDescriptor task3 = new TaskDescriptor();
        task3.setLabel(TranslatableContent.build("en", "task3"));
        task3.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task3);

        // and duplicate it
        task2.getPredecessors().clear();
        Set<String> preds = new HashSet<>();
        preds.addAll(Arrays.asList("task3"));
        task2.setPredecessorNames(preds);
        TaskDescriptor updated = (TaskDescriptor) variableDescriptorFacade.update(task2.getId(), task2);
        assertEquals("task3", updated.getPredecessor(0).getLabel().translateOrEmpty(gameModel));
        assertEquals(1, updated.getPredecessors().size());

        // Clean
        variableDescriptorFacade.remove(task.getId());
        variableDescriptorFacade.remove(task2.getId());
        variableDescriptorFacade.remove(task3.getId());
    }

    @Test
    public void testRemovePredecessors() throws Exception {

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel(TranslatableContent.build("en", "My task"));
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task);

        // Create a second task
        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel(TranslatableContent.build("en", "My task2"));
        task2.setDefaultInstance(new TaskInstance());
        task2.addPredecessor(task);
        variableDescriptorFacade.create(scenario.getId(), task2);

        TaskDescriptor created = (TaskDescriptor) variableDescriptorFacade.find(task2.getId());
        assertEquals("My task", created.getPredecessor(0).getLabel().translateOrEmpty(scenario));
        assertEquals(1, created.getPredecessors().size());

        // Create a third task
        TaskDescriptor task3 = new TaskDescriptor();
        task3.setLabel(TranslatableContent.build("en", "task3"));
        task3.setDefaultInstance(new TaskInstance());
        task3.addPredecessor(task2);
        variableDescriptorFacade.create(scenario.getId(), task3);

        assertEquals("My task2", task3.getPredecessor(0).getLabel().translateOrEmpty(scenario));
        assertEquals(1, task3.getPredecessors().size());

        variableDescriptorFacade.remove(task2.getId());
        //variableDescriptorFacade.flush();

        //assertEquals(0, task3.getPredecessors().size());
        // Clean
        variableDescriptorFacade.remove(task.getId());
        variableDescriptorFacade.remove(task3.getId());
    }

    @Test
    public void testAssignemntCascadedDeletion() {
        // Create a resource
        ResourceDescriptor paul = new ResourceDescriptor();
        paul.setLabel(TranslatableContent.build("en", "Paul"));
        paul.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), paul);

        // Create a resource
        ResourceDescriptor roger = new ResourceDescriptor();
        roger.setLabel(TranslatableContent.build("en", "Roger"));
        roger.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(scenario.getId(), roger);

        // Create a task
        TaskDescriptor task1 = new TaskDescriptor();
        task1.setLabel(TranslatableContent.build("en", "My task"));
        task1.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(scenario.getId(), task1);
        gameModelFacade.reset(scenario.getId());

        TaskInstance taskI = task1.getInstance(player);
        // Assign resource to task1
        resourceFacade.assign(paul.getInstance(player).getId(), taskI.getId());
        resourceFacade.assign(roger.getInstance(player).getId(), taskI.getId());

        ResourceInstance paulI;
        ResourceInstance rogerI;
        task1 = ((TaskDescriptor) variableDescriptorFacade.find(task1.getId()));
        taskI = task1.getInstance(player);
        paulI = ((ResourceDescriptor) variableDescriptorFacade.find(paul.getId())).getInstance(player);
        rogerI = ((ResourceDescriptor) variableDescriptorFacade.find(roger.getId())).getInstance(player);

        assertEquals(2, taskI.getAssignments().size());
        assertNotNull(taskI.getAssignments().get(0));
        assertNotNull(taskI.getAssignments().get(1));

        assertEquals(1, rogerI.getAssignments().size());
        assertNotNull(rogerI.getAssignments().get(0));

        assertEquals(1, paulI.getAssignments().size());
        assertNotNull(paulI.getAssignments().get(0));

        variableDescriptorFacade.remove(paul.getId());

        task1 = ((TaskDescriptor) variableDescriptorFacade.find(task1.getId()));
        taskI = task1.getInstance(player);
        rogerI = ((ResourceDescriptor) variableDescriptorFacade.find(roger.getId())).getInstance(player);

        assertEquals(1, taskI.getAssignments().size());
        assertNotNull(taskI.getAssignments().get(0));

        assertEquals(1, rogerI.getAssignments().size());
        assertNotNull(rogerI.getAssignments().get(0));

        variableDescriptorFacade.remove(task1.getId());

        rogerI = ((ResourceDescriptor) variableDescriptorFacade.find(roger.getId())).getInstance(player);

        assertEquals(0, rogerI.getAssignments().size());
    }
}
