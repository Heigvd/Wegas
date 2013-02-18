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
import com.wegas.core.persistence.game.Player;
import com.wegas.leaderway.persistence.ResourceInstance;
import com.wegas.leaderway.persistence.TaskInstance;
import com.wegas.leaderway.persistence.WRequirement;
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
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    @EJB
    private VariableInstanceFacade variableInstanceFacade;

    /**
     * 
     * @param resourceInstance
     * @param taskInstance 
     */
    public void assign(ResourceInstance resourceInstance, TaskInstance taskInstance) {
        resourceInstance.assign(taskInstance);
    }

    /**
     * 
     * @param p
     * @param resourceDescriptorId
     * @param taskDescriptorId 
     */
    public void assign(Player p, Long resourceDescriptorId, Long taskDescriptorId) {
        this.assign((ResourceInstance) variableInstanceFacade.find(resourceDescriptorId, p),
                (TaskInstance) variableInstanceFacade.find(taskDescriptorId, p));
    }
    
    /**
     * 
     * @param resourceInstance
     * @param taskInstance 
     */
    public void assignActivity(ResourceInstance resourceInstance, TaskInstance taskInstance) {
        resourceInstance.assignActivity(taskInstance);
    }
    
    /**
     * 
     * @param resourceInstance
     * @param taskInstance
     * @param wrequirement 
     */
    public void assignActivity(ResourceInstance resourceInstance, TaskInstance taskInstance, WRequirement wrequirement) {
        resourceInstance.assignActivity(taskInstance, wrequirement);
    }
    
    /**
     * 
     * @param resourceInstance
     * @param taskInstance
     * @param startTime
     * @param duration
     * @param completion 
     */
    public void assignActivity(ResourceInstance resourceInstance, TaskInstance taskInstance, Double startTime, Double duration, Integer completion) {
        resourceInstance.assignActivity(taskInstance, startTime, duration, completion);
    }
    
    /**
     * 
     * @param resourceInstance
     * @param taskInstance
     * @param wrequirement
     * @param startTime
     * @param duration
     * @param completion 
     */
    public void assignActivity(ResourceInstance resourceInstance, TaskInstance taskInstance, WRequirement wrequirement, Double startTime, Double duration, Integer completion) {
        resourceInstance.assignActivity(taskInstance, wrequirement, startTime, duration, completion);
    }
}
