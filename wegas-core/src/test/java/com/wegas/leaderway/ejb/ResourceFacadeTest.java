/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.ejb;

import com.wegas.core.ejb.AbstractEJBTest;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.variable.scope.TeamScope;
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
     * Test of assign method, of class ResourceFacade.
     */
    @Test
    public void testAssignment() throws NamingException {

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
        resourceFacade.assign(player, res.getId(), task.getId());
        assertEquals(
                ((ResourceInstance) vif.find(res.getId(), player)).getAssignments().get(0).getTaskInstance(),
                task.getInstance(player));
        assertEquals(
                res.getInstance(player),
                ((TaskInstance) vif.find(task.getId(), player)).getAssignments().get(0).getResourceInstance());

        // Clean
        vdf.remove(res.getId());
        vdf.remove(task.getId());
    }

    @Test
    public void testResource() throws NamingException {
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
    }
}
