/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.ejb;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.persistence.game.Script;
import com.wegas.resourceManagement.persistence.Assignment;
import com.wegas.resourceManagement.persistence.Occupation;
import com.wegas.resourceManagement.persistence.ResourceDescriptor;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.resourceManagement.persistence.WRequirement;
import java.util.ArrayList;
import java.util.Arrays;
import javax.naming.NamingException;
import org.junit.Assert;
import static org.junit.Assert.*;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com), Benjamin Gerber
 * <ger.benjamin@gmail.com>
 */
public class ResourceFacadeTest extends AbstractEJBTest {

    static final private Logger logger = LoggerFactory.getLogger(ResourceFacade.class);
    private static ResourceFacade resourceFacade;

    @BeforeClass
    public static void setUpClass() {
        resourceFacade = ResourceFacade.lookup();
    }

    @Test
    public void testAssignmentsCascadeFromTaskDescriptor() throws Exception {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task);

        resourceFacade.assign(res.getInstance(player).getId(), task.getId());

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getAssignments().get(0).getTaskDescriptor().getInstance(player),
                task.getInstance(player));

        assertEquals(
                ((TaskDescriptor) variableDescriptorFacade.find(task.getId())).getAssignments().get(0).getResourceInstance(),
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
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task);

        resourceFacade.assign(res.getInstance(player).getId(), task.getId());

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getAssignments().get(0).getTaskDescriptor().getInstance(player),
                task.getInstance(player));

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task.getId());
    }

    /**
     * Test of assign method, of class ResourceFacade.
     */
    @Test
    public void testAssignment() throws NamingException {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task);

        // Assign resource to task
        resourceFacade.assign(res.getInstance(player).getId(), task.getId());

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getAssignments().get(0).getTaskDescriptor().getInstance(player),
                task.getInstance(player));

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task.getId());
    }

    /**
     * Remove Assignment Test
     */
    @Test
    public void testRemoveAssignment() throws NamingException {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task);

        // Assign resource to task
        resourceFacade.assign(res.getInstance(player).getId(), task.getId());

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getAssignments().get(0).getTaskDescriptor().getInstance(player),
                task.getInstance(player));

        Assignment assignment = resourceFacade.findAssignment(res.getInstance(player).getId(), task.getId());
        resourceFacade.removeAssignment(assignment.getId());

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task.getId());
    }

    /**
     * Remove Assignment Test
     */
    @Test
    public void testMergeAssignment_Add() throws NamingException {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task);

        ResourceInstance defaultInstance = res.getDefaultInstance();
        Assignment assignment = new Assignment();
        assignment.setResourceInstance(defaultInstance);
        assignment.setTaskDescriptor(task);
        defaultInstance.addAssignment(assignment);

        variableDescriptorFacade.update(res.getId(), res);

        task = (TaskDescriptor) variableDescriptorFacade.find(task.getId());
        res = (ResourceDescriptor) variableDescriptorFacade.find(res.getId());
        Assert.assertEquals(1, task.getAssignments().size());
    }

    /**
     * Remove Assignment Test. Script eval version
     */
    @Test
    public void testRemoveAssignmentFromScript() throws NamingException {
        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setName("paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("task");
        task.setName("task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task);
        String script = "var rF = new javax.naming.InitialContext().lookup('java:module/ResourceFacade');\n"
                + "var paul = Variable.find(gameModel, \"paul\");\n"
                + "var paulI = paul.getInstance(self);\n"
                + "var task = Variable.find(gameModel, \"task\");\n"
                + "rF.assign(paulI.getId(), task.getId());\n";

        scriptFacade.eval(player, new Script("javascript", script), null);

        String script2 = "var rF = new javax.naming.InitialContext().lookup('java:module/ResourceFacade');\n"
                + "var paul = Variable.find(gameModel, \"paul\");\n"
                + "var paulI = paul.getInstance(self);\n"
                + "var task = Variable.find(gameModel, \"task\");\n"
                + "rF.removeAssignment(rF.findAssignment(paulI.getId(), task.getId()).getId());\n";

        scriptFacade.eval(player, new Script("javascript", script2), null);

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task.getId());
    }

    /**
     * Test of createActivity method, of class ResourceFacade.
     */
    @Test
    public void testCreateActivity_ResourceInstance_TaskDescriptor() throws Exception {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task);

        // Create activity between resource to task
        resourceFacade.createActivity(res.getInstance(player).getId(), task.getId());

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getActivities().get(0).getTaskDescriptor().getInstance(player),
                task.getInstance(player));

        // Clean
        variableDescriptorFacade.remove(res.getId());
        variableDescriptorFacade.remove(task.getId());
    }

    /**
     * Test of createActivity method, of class ResourceFacade.
     */
    @Test
    public void testCreateActivity() throws NamingException {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task);

        // Assign activity between resource to task
        resourceFacade.createActivity(res.getInstance(player).getId(), task.getId());

        assertEquals(
                ((ResourceInstance) variableInstanceFacade.find(res.getId(), player)).getActivities().get(0).getTaskDescriptor().getInstance(player),
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
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

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
    public void testAddOccupation() throws NamingException {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

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
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

        // Add occupation to a resource
        resourceFacade.addOccupation(res.getInstance(player).getId(), false, 1.0);

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
     *
     * @throws javax.naming.NamingException
     */
    @Test
    public void testAddReservation() throws NamingException {

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

        // reserve Paul for the 1.0 period
        resourceFacade.addOccupation(res.getInstance(player).getId(), true, 1.0);

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
    public void testMoveAssignment() throws NamingException {
        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task1 = new TaskDescriptor();
        task1.setLabel("My task");
        task1.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task1);

        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel("My task");
        task2.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task2);

        TaskDescriptor task3 = new TaskDescriptor();
        task3.setLabel("My task");
        task3.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task3);

        // Assign resource to task
        resourceFacade.assign(res.getInstance(player).getId(), task1.getId());
        resourceFacade.assign(res.getInstance(player).getId(), task2.getId());
        Assignment assignment = resourceFacade.assign(res.getInstance(player).getId(), task3.getId());

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
    public void testAddRequirements() throws NamingException {
        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        TaskInstance taskInstance = new TaskInstance();
        task.setDefaultInstance(taskInstance);

        //assign new requirement in task
        WRequirement requirement = new WRequirement();
        requirement.setLimit(100);
        requirement.setLevel(58);
        requirement.setQuantity(1L);
        requirement.setWork("Carpenter");
        taskInstance.addRequirement(requirement);

        variableDescriptorFacade.create(gameModel.getId(), task);

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
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task);

        // Create a second task
        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel("My task2");
        TaskInstance taskInstance = new TaskInstance();
        ArrayList<WRequirement> requirements = new ArrayList<>();
        requirements.add(new WRequirement("engineer"));
        taskInstance.setRequirements(requirements);
        task2.setDefaultInstance(taskInstance);
        task2.addPredecessor(task);
        variableDescriptorFacade.create(gameModel.getId(), task2);
        assertEquals("engineer", task2.getDefaultInstance().getRequirements().get(0).getWork());

        // and duplicate it
        TaskDescriptor duplicate = (TaskDescriptor) variableDescriptorFacade.duplicate(task2.getId());
        assertEquals("engineer", duplicate.getDefaultInstance().getRequirements().get(0).getWork());
        assertEquals("My task", duplicate.getPredecessor(0).getLabel());

        // Clean
        variableDescriptorFacade.remove(task.getId());
        variableDescriptorFacade.remove(task2.getId());
    }

    @Test
    public void testAddPredecessors() throws Exception {

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task);

        // Create a second task
        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel("My task2");
        task2.setDefaultInstance(new TaskInstance());
        task2.addPredecessor(task);
        variableDescriptorFacade.create(gameModel.getId(), task2);

        TaskDescriptor created = (TaskDescriptor) variableDescriptorFacade.find(task2.getId());
        assertEquals("My task", created.getPredecessor(0).getLabel());
        assertEquals(1, created.getPredecessors().size());

        // Create a task
        TaskDescriptor task3 = new TaskDescriptor();
        task3.setLabel("task3");
        task3.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task3);

        // and duplicate it
        task2.getPredecessors().clear();
        task2.setPredecessorNames(Arrays.asList("task3"));
        TaskDescriptor updated = (TaskDescriptor) variableDescriptorFacade.update(task2.getId(), task2);
        assertEquals("task3", updated.getPredecessor(0).getLabel());
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
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task);

        // Create a second task
        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel("My task2");
        task2.setDefaultInstance(new TaskInstance());
        task2.addPredecessor(task);
        variableDescriptorFacade.create(gameModel.getId(), task2);

        TaskDescriptor created = (TaskDescriptor) variableDescriptorFacade.find(task2.getId());
        assertEquals("My task", created.getPredecessor(0).getLabel());
        assertEquals(1, created.getPredecessors().size());

        // Create a third task
        TaskDescriptor task3 = new TaskDescriptor();
        task3.setLabel("task3");
        task3.setDefaultInstance(new TaskInstance());
        task3.addPredecessor(task2);
        variableDescriptorFacade.create(gameModel.getId(), task3);

        assertEquals("My task2", task3.getPredecessor(0).getLabel());
        assertEquals(1, task3.getPredecessors().size());

        variableDescriptorFacade.remove(task2.getId());
        //variableDescriptorFacade.flush();

        //assertEquals(0, task3.getPredecessors().size());
        // Clean
        variableDescriptorFacade.remove(task.getId());
        variableDescriptorFacade.remove(task3.getId());
    }

    @Test
    public void testAssignemntCascadedDeletion() throws NamingException {

        // Create a resource
        ResourceDescriptor paul = new ResourceDescriptor();
        paul.setLabel("Paul");
        paul.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), paul);

        // Create a resource
        ResourceDescriptor roger = new ResourceDescriptor();
        roger.setLabel("Roger");
        roger.setDefaultInstance(new ResourceInstance());
        variableDescriptorFacade.create(gameModel.getId(), roger);

        // Create a task
        TaskDescriptor task1 = new TaskDescriptor();
        task1.setLabel("My task");
        task1.setDefaultInstance(new TaskInstance());
        variableDescriptorFacade.create(gameModel.getId(), task1);
        gameModelFacade.reset(gameModel.getId());

        // Assign resource to task
        resourceFacade.assign(paul.getInstance(player).getId(), task1.getId());
        resourceFacade.assign(roger.getInstance(player).getId(), task1.getId());

        ResourceInstance paulI;
        ResourceInstance rogerI;
        task1 = ((TaskDescriptor) variableDescriptorFacade.find(task1.getId()));
        paulI = ((ResourceDescriptor) variableDescriptorFacade.find(paul.getId())).getInstance(player);
        rogerI = ((ResourceDescriptor) variableDescriptorFacade.find(roger.getId())).getInstance(player);

        assertEquals(2, task1.getAssignments().size());
        assertNotNull(task1.getAssignments().get(0));
        assertNotNull(task1.getAssignments().get(1));

        assertEquals(1, rogerI.getAssignments().size());
        assertNotNull(rogerI.getAssignments().get(0));

        assertEquals(1, paulI.getAssignments().size());
        assertNotNull(paulI.getAssignments().get(0));

        variableDescriptorFacade.remove(paul.getId());

        task1 = ((TaskDescriptor) variableDescriptorFacade.find(task1.getId()));
        rogerI = ((ResourceDescriptor) variableDescriptorFacade.find(roger.getId())).getInstance(player);

        assertEquals(1, task1.getAssignments().size());
        assertNotNull(task1.getAssignments().get(0));

        assertEquals(1, rogerI.getAssignments().size());
        assertNotNull(rogerI.getAssignments().get(0));

        variableDescriptorFacade.remove(task1.getId());

        rogerI = ((ResourceDescriptor) variableDescriptorFacade.find(roger.getId())).getInstance(player);

        assertEquals(0, rogerI.getAssignments().size());
    }
}
