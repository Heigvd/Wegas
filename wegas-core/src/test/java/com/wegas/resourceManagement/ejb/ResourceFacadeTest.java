/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.ejb;

import com.wegas.core.ejb.AbstractEJBTest;
import static com.wegas.core.ejb.AbstractEJBTest.lookupBy;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
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
import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertTrue;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>, Benjamin Gerber
 * <ger.benjamin@gmail.com>
 */
public class ResourceFacadeTest extends AbstractEJBTest {

    static final private Logger logger = LoggerFactory.getLogger(ResourceFacade.class);

    @Test
    public void testAssignmentsCascadeFromTaskDescriptor() throws Exception {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task);

        resourceFacade.assign(res.getInstance(player).getId(), task.getId());

        assertEquals(
            ((ResourceInstance) vif.find(res.getId(), player)).getAssignments().get(0).getTaskDescriptor().getInstance(player),
            task.getInstance(player));

        assertEquals(
            ((TaskDescriptor) vdf.find(task.getId())).getAssignments().get(0).getResourceInstance(),
            res.getInstance(player));

        vdf.remove(task.getId());

        /*assertTrue("Resource assignments not empty", 
            ((ResourceInstance) vif.find(res.getId(), player)).getAssignments().isEmpty());*/
        // Clean
        vdf.remove(res.getId());
    }

    /**
     * Test of assign method, of class ResourceFacade.
     */
    @Test
    public void testAssign_ResourceInstance_TaskInstance() throws Exception {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task);

        resourceFacade.assign(res.getInstance(player).getId(), task.getId());

        assertEquals(
            ((ResourceInstance) vif.find(res.getId(), player)).getAssignments().get(0).getTaskDescriptor().getInstance(player),
            task.getInstance(player));

        // Clean
        vdf.remove(res.getId());
        vdf.remove(task.getId());
    }

    /**
     * Test of assign method, of class ResourceFacade.
     */
    @Test
    public void testAssignment() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task);

        // Assign resource to task
        resourceFacade.assign(res.getInstance(player).getId(), task.getId());

        assertEquals(
            ((ResourceInstance) vif.find(res.getId(), player)).getAssignments().get(0).getTaskDescriptor().getInstance(player),
            task.getInstance(player));

        // Clean
        vdf.remove(res.getId());
        vdf.remove(task.getId());
    }

    /**
     * Test of createActivity method, of class ResourceFacade.
     */
    @Test
    public void testCreateActivity_ResourceInstance_TaskDescriptor() throws Exception {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task);

        // Create activity between resource to task
        resourceFacade.createActivity(res.getInstance(player).getId(), task.getId());

        assertEquals(
            ((ResourceInstance) vif.find(res.getId(), player)).getActivities().get(0).getTaskDescriptor().getInstance(player),
            task.getInstance(player));

        // Clean
        vdf.remove(res.getId());
        vdf.remove(task.getId());
    }

    /**
     * Test of createActivity method, of class ResourceFacade.
     */
    @Test
    public void testCreateActivity() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task);

        // Assign activity between resource to task
        resourceFacade.createActivity(res.getInstance(player).getId(), task.getId());

        assertEquals(
            ((ResourceInstance) vif.find(res.getId(), player)).getActivities().get(0).getTaskDescriptor().getInstance(player),
            task.getInstance(player));

        // Clean
        vdf.remove(res.getId());
        vdf.remove(task.getId());
    }

    /**
     * Test of addOccupation method, of class ResourceFacade.
     */
    @Test
    public void testAddOccupation_ResourceInstance() throws Exception {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        vdf.create(gameModel.getId(), res);

        // Add occupation to a resource
        resourceFacade.addOccupation(res.getInstance(player).getId(), false, 1);

        assertEquals(
            ((ResourceInstance) vif.find(res.getId(), player)).getOccupations().get(0).getResourceInstance(),
            res.getInstance(player));

        // Clean
        vdf.remove(res.getId());
    }

    /**
     * Test of addOccupation method, of class ResourceFacade.
     */
    @Test
    public void testAddOccupation() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        vdf.create(gameModel.getId(), res);

        // add occupation between to a resource
        resourceFacade.addOccupation(res.getInstance(player).getId(), true, 1);

        assertEquals(
            ((ResourceInstance) vif.find(res.getId(), player)).getOccupations().get(0).getResourceInstance(),
            res.getInstance(player));

        // Clean
        vdf.remove(res.getId());
    }

    /**
     * Test of addOccupation method, of class ResourceFacade.
     *
     * @throws java.lang.Exception
     */
    @Test
    public void testAddOccupation2() throws Exception {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        vdf.create(gameModel.getId(), res);

        // Add occupation to a resource
        resourceFacade.addOccupation(res.getInstance(player).getId(), false, 1.0);

        Occupation newOccupation = ((ResourceInstance) vif.find(res.getId(), player)).getOccupations().get(0);

        // Check resource instance has been correctly setted 
        assertEquals(newOccupation.getResourceInstance(), res.getInstance(player));

        // Check the editiable occupation mode
        assertEquals(false, newOccupation.getEditable());

        // Check the occupation time
        assertEquals(1.0, newOccupation.getTime(), 0.00001);

        // Clean
        vdf.remove(res.getId());
    }

    /**
     * Test ResourceFacade.addReservation
     *
     * @throws javax.naming.NamingException
     */
    @Test
    public void testAddReservation() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        vdf.create(gameModel.getId(), res);

        // reserve Paul for the 1.0 period
        resourceFacade.addOccupation(res.getInstance(player).getId(), true, 1.0);

        Occupation newOccupation = ((ResourceInstance) vif.find(res.getId(), player)).getOccupations().get(0);
        // Check resource instance has been correctly setted 
        assertEquals(newOccupation.getResourceInstance(), res.getInstance(player));
        // Check the editiable occupation mode
        assertEquals(true, newOccupation.getEditable());

        // Clean
        vdf.remove(res.getId());
    }

    /**
     * Test of moveAssignment method, of class ResourceFacade.
     */
    @Test
    public void testMoveAssignment() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task1 = new TaskDescriptor();
        task1.setLabel("My task");
        task1.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task1);

        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel("My task");
        task2.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task2);

        TaskDescriptor task3 = new TaskDescriptor();
        task3.setLabel("My task");
        task3.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task3);

        // Assign resource to task
        resourceFacade.assign(res.getInstance(player).getId(), task1.getId());
        resourceFacade.assign(res.getInstance(player).getId(), task2.getId());
        Assignment assignment = resourceFacade.assign(res.getInstance(player).getId(), task3.getId());

        //Move last assignement (pos 2) at pos (0)
        resourceFacade.moveAssignment(assignment.getId(), 0);

        assertEquals(
            ((ResourceInstance) vif.find(res.getId(), player)).getAssignments().get(0).getId(),
            assignment.getId());

        // Clean
        vdf.remove(res.getId());
        vdf.remove(task1.getId());
        vdf.remove(task2.getId());
        vdf.remove(task3.getId());
    }

    /**
     * Test of requirements methods, of class resourceInstance
     */
    @Test
    public void testAddRequirements() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

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

        vdf.create(gameModel.getId(), task);

        //test on work variable because if it match, requierements work.
        assertEquals(((TaskInstance) vif.find(task.getInstance(player).getId())).getRequirements().get(0).getWork(),
            requirement.getWork());

        // Clean
        vdf.remove(task.getId());
    }

    @Test
    public void testDuplicateTaskDescriptor() throws Exception {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task);

        // Create a second task
        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel("My task2");
        TaskInstance taskInstance = new TaskInstance();
        ArrayList<WRequirement> requirements = new ArrayList<>();
        requirements.add(new WRequirement("engineer"));
        taskInstance.setRequirements(requirements);
        task2.setDefaultInstance(taskInstance);
        task2.addPredecessor(task);
        vdf.create(gameModel.getId(), task2);
        assertEquals("engineer", ((TaskInstance) task2.getDefaultInstance()).getRequirements().get(0).getWork());

        // and duplicate it
        TaskDescriptor duplicate = (TaskDescriptor) vdf.duplicate(task2.getId());
        assertEquals("engineer", ((TaskInstance) duplicate.getDefaultInstance()).getRequirements().get(0).getWork());
        assertEquals("My task", duplicate.getPredecessor(0).getLabel());

        // Clean
        vdf.remove(task.getId());
        vdf.remove(task2.getId());
    }

    @Test
    public void testAddPredecessors() throws Exception {
        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task);

        // Create a second task
        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel("My task2");
        task2.setDefaultInstance(new TaskInstance());
        task2.addPredecessor(task);
        vdf.create(gameModel.getId(), task2);

        TaskDescriptor created = (TaskDescriptor) vdf.find(task2.getId());
        assertEquals("My task", created.getPredecessor(0).getLabel());
        assertEquals(1, created.getPredecessors().size());

        // Create a task
        TaskDescriptor task3 = new TaskDescriptor();
        task3.setLabel("task3");
        task3.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task3);

        // and duplicate it
        task2.getPredecessors().clear();
        task2.setPredecessorNames(Arrays.asList("task3"));
        TaskDescriptor updated = (TaskDescriptor) vdf.update(task2.getId(), task2);
        assertEquals("task3", updated.getPredecessor(0).getLabel());
        assertEquals(1, updated.getPredecessors().size());

        // Clean
        vdf.remove(task.getId());
        vdf.remove(task2.getId());
        vdf.remove(task3.getId());
    }

    @Test
    public void testRemovePredecessors() throws Exception {
        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        vdf.create(gameModel.getId(), task);

        // Create a second task
        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel("My task2");
        task2.setDefaultInstance(new TaskInstance());
        task2.addPredecessor(task);
        vdf.create(gameModel.getId(), task2);

        TaskDescriptor created = (TaskDescriptor) vdf.find(task2.getId());
        assertEquals("My task", created.getPredecessor(0).getLabel());
        assertEquals(1, created.getPredecessors().size());

        // Create a third task
        TaskDescriptor task3 = new TaskDescriptor();
        task3.setLabel("task3");
        task3.setDefaultInstance(new TaskInstance());
        task3.addPredecessor(task2);
        vdf.create(gameModel.getId(), task3);

        assertEquals("My task2", task3.getPredecessor(0).getLabel());
        assertEquals(1, task3.getPredecessors().size());

        vdf.remove(task2.getId());
        //vdf.flush();

        //assertEquals(0, task3.getPredecessors().size());
        // Clean
        vdf.remove(task.getId());
        vdf.remove(task3.getId());
    }
}
