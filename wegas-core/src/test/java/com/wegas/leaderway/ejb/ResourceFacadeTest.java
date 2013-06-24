/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.ejb;

import com.wegas.core.ejb.AbstractEJBTest;
import static com.wegas.core.ejb.AbstractEJBTest.lookupBy;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.variable.scope.TeamScope;
import com.wegas.leaderway.persistence.Assignment;
import com.wegas.leaderway.persistence.ResourceDescriptor;
import com.wegas.leaderway.persistence.ResourceInstance;
import com.wegas.leaderway.persistence.TaskDescriptor;
import com.wegas.leaderway.persistence.TaskInstance;
import javax.naming.NamingException;
import static org.junit.Assert.assertEquals;
import org.junit.Test;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class ResourceFacadeTest extends AbstractEJBTest {

    /**
     * Test of history methods, of class ResourceInstance
     *
     * @throws NamingException
     */
    @Test
    public void testResourceHistory() throws NamingException {
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);

        // Create a resource
        final ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        res.setScope(new TeamScope());
        vdf.create(gameModel.getId(), res);

        // Test history
        ResourceInstance resI = res.getInstance(player);
        for (int i = 0; i < ResourceInstance.HISTORYSIZE + 10; i++) {
            resI.setConfidence(i);
            vif.update(resI.getId(), resI);
        }
        resI = (ResourceInstance) vif.find(resI.getId());
        assertEquals(Integer.valueOf(ResourceInstance.HISTORYSIZE + 9), resI.getConfidence());
        assertEquals(ResourceInstance.HISTORYSIZE, resI.getConfidenceHistory().size());

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
        res.setScope(new TeamScope());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        task.setScope(new TeamScope());
        vdf.create(gameModel.getId(), task);

        resourceFacade.assign(res.getInstance(player), task);

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
        res.setScope(new TeamScope());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        task.setScope(new TeamScope());
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
     * Test of assignActivity method, of class ResourceFacade.
     */
    @Test
    public void testAssignActivity_ResourceInstance_TaskDescriptor() throws Exception {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        res.setScope(new TeamScope());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        task.setScope(new TeamScope());
        vdf.create(gameModel.getId(), task);

        // Assign activity between resource to task
        resourceFacade.assignActivity(res.getInstance(player), task);

        assertEquals(
                ((ResourceInstance) vif.find(res.getId(), player)).getActivities().get(0).getTaskDescriptor().getInstance(player),
                task.getInstance(player));

        // Clean
        vdf.remove(res.getId());
        vdf.remove(task.getId());
    }

    /**
     * Test of assignActivity method, of class ResourceFacade.
     */
    @Test
    public void testAssignActivity() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        res.setScope(new TeamScope());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        task.setScope(new TeamScope());
        vdf.create(gameModel.getId(), task);

        // Assign activity between resource to task
        resourceFacade.assignActivity(res.getInstance(player).getId(), task.getId());

        assertEquals(
                ((ResourceInstance) vif.find(res.getId(), player)).getActivities().get(0).getTaskDescriptor().getInstance(player),
                task.getInstance(player));

        // Clean
        vdf.remove(res.getId());
        vdf.remove(task.getId());
    }
    
    /**
     * Test of assignActivity method, of class ResourceFacade.
     */
    @Test
    public void testAssignOccupation_ResourceInstance_TaskDescriptor() throws Exception {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        res.setScope(new TeamScope());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        task.setScope(new TeamScope());
        vdf.create(gameModel.getId(), task);

        // Assign activity between resource to task
        resourceFacade.assignOccupation(res.getInstance(player), task);

        assertEquals(
                ((ResourceInstance) vif.find(res.getId(), player)).getOccupations().get(0).getTaskDescriptor().getInstance(player),
                task.getInstance(player));

        // Clean
        vdf.remove(res.getId());
        vdf.remove(task.getId());
    }

    /**
     * Test of assignActivity method, of class ResourceFacade.
     */
    @Test
    public void testAssignOccupation() throws NamingException {

        // Lookup Ejb's
        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);

        // Create a resource
        ResourceDescriptor res = new ResourceDescriptor();
        res.setLabel("Paul");
        res.setDefaultInstance(new ResourceInstance());
        res.setScope(new TeamScope());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task = new TaskDescriptor();
        task.setLabel("My task");
        task.setDefaultInstance(new TaskInstance());
        task.setScope(new TeamScope());
        vdf.create(gameModel.getId(), task);

        // Assign activity between resource to task
        resourceFacade.assignOccupation(res.getInstance(player).getId(), task.getId());

        assertEquals(
                ((ResourceInstance) vif.find(res.getId(), player)).getOccupations().get(0).getTaskDescriptor().getInstance(player),
                task.getInstance(player));

        // Clean
        vdf.remove(res.getId());
        vdf.remove(task.getId());
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
        res.setScope(new TeamScope());
        vdf.create(gameModel.getId(), res);

        // Create a task
        TaskDescriptor task1 = new TaskDescriptor();
        task1.setLabel("My task");
        task1.setDefaultInstance(new TaskInstance());
        task1.setScope(new TeamScope());
        vdf.create(gameModel.getId(), task1);

        TaskDescriptor task2 = new TaskDescriptor();
        task2.setLabel("My task");
        task2.setDefaultInstance(new TaskInstance());
        task2.setScope(new TeamScope());
        vdf.create(gameModel.getId(), task2);

        TaskDescriptor task3 = new TaskDescriptor();
        task3.setLabel("My task");
        task3.setDefaultInstance(new TaskInstance());
        task3.setScope(new TeamScope());
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
//    /**
//     * Test of requirements methods, of class resourceInstance
//     */
//    @Test
//    public void testRequirements() throws NamingException {
//
//        // Lookup Ejb's
//        final VariableDescriptorFacade vdf = lookupBy(VariableDescriptorFacade.class);
//        final VariableInstanceFacade vif = lookupBy(VariableInstanceFacade.class);
//        final ResourceFacade resourceFacade = lookupBy(ResourceFacade.class);
//
//        // Create a resource
//        ResourceDescriptor res = new ResourceDescriptor();
//        res.setLabel("Paul");
//        res.setDefaultInstance(new ResourceInstance());
//        res.setScope(new TeamScope());
//        vdf.create(gameModel.getId(), res);
//
//        // Create a task
//        TaskDescriptor task = new TaskDescriptor();
//        task.setLabel("My task");
//        task.setDefaultInstance(new TaskInstance());
//        task.setScope(new TeamScope());
//        vdf.create(gameModel.getId(), task);
//
//        //assign new requirement in task
//        WRequirement requirement = new WRequirement();
//        requirement.setLimit(100);
//        requirement.setLevel(58);
//        requirement.setNumber(1L);
//        requirement.setPurview("engineer");
//
//        resourceFacade.test(requirement, task.getId(), res.getId(), player);
//
//
//        //test
//        assertEquals(((TaskDescriptor) vdf.find(task.getId())).getRequirements().get(0).getId(),
//                ((ResourceInstance) vif.find(res.getId(), player)).getActivities().get(0).getWrequirement().getId());
//
//        // Clean
//        vdf.remove(res.getId());
//        vdf.remove(task.getId());
//    }
}
