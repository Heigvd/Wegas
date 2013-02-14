/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.ejb;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.Player;
import com.wegas.leaderway.persistence.Assignment;
import com.wegas.leaderway.persistence.ResourceDescriptor;
import com.wegas.leaderway.persistence.ResourceInstance;
import com.wegas.leaderway.persistence.TaskDescriptor;
import com.wegas.leaderway.persistence.TaskInstance;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class ResourceFacade {

    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

    /**
     *
     * @param resourceInstance
     * @param startTime
     * @param task
     */
    public Assignment assign(ResourceInstance resourceInstance, TaskInstance taskInstance) {
        return resourceInstance.assign(taskInstance);
    }

    /**
     *
     * @param player
     * @param resourceDescriptorId
     * @param startTime
     * @param taskId
     */
    public Assignment assign(Player player, Long resourceDescriptorId, Long taskDescriptorId) {
        return this.assign(
                ((ResourceDescriptor) variableDescriptorFacade.find(resourceDescriptorId)).getInstance(player),
                ((TaskDescriptor) variableDescriptorFacade.find(taskDescriptorId)).getInstance(player));
    }
}
