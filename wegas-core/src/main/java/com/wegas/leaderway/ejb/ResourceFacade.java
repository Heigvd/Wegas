/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.leaderway.ejb;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.leaderway.persistence.Activity;
import com.wegas.leaderway.persistence.Assignment;
import com.wegas.leaderway.persistence.ResourceInstance;
import com.wegas.leaderway.persistence.TaskInstance;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class ResourceFacade {

    static final private Logger logger = LoggerFactory.getLogger(ResourceFacade.class);
    /**
     * 
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public ResourceFacade() {
    }
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @EJB
    private VariableInstanceFacade variableInstanceFacade;

    /**
     *
     * @param resourceInstance
     * @param taskInstance
     */
    public Assignment assign(ResourceInstance resourceInstance, TaskInstance taskInstance) {
        resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstance.getId());
        return resourceInstance.assign(taskInstance);
    }

    /**
     *
     * @param p
     * @param resourceDescriptorId
     * @param taskDescriptorId
     */
    public Assignment assign(Long resourceInstanceId, Long taskInstanceId) {
        return this.assign((ResourceInstance) variableInstanceFacade.find(resourceInstanceId), (TaskInstance) variableInstanceFacade.find(taskInstanceId));
    }

    /**
     *
     * @param resourceInstance
     * @param taskInstance
     */
    public Activity assignActivity(ResourceInstance resourceInstance, TaskInstance taskInstance) {
        resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstance.getId());
        return resourceInstance.assignActivity(taskInstance);
    }

    /**
     *
     * @param resourceInstance
     * @param taskInstance
     */
    public Activity assignActivity(Long resourceInstanceId, Long taskInstanceId) {
        return this.assignActivity((ResourceInstance) variableInstanceFacade.find(resourceInstanceId),
                (TaskInstance) variableInstanceFacade.find(taskInstanceId));
    }

    /**
     * 
     * @param assignementId
     * @param index 
     */
    public void moveAssignment(final Long assignementId, final int index) {
        final Assignment assignement = this.em.find(Assignment.class, assignementId);
        assignement.getResourceInstance().getAssignments().remove(assignement);
        assignement.getResourceInstance().getAssignments().add(index, assignement);
    }
}
