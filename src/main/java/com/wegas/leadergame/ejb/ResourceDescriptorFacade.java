/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.leadergame.ejb;

import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.Player;
import com.wegas.leadergame.persistence.ResourceDescriptor;
import com.wegas.leadergame.persistence.ResourceInstance;
import com.wegas.leadergame.persistence.TaskDescriptor;
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
public class ResourceDescriptorFacade extends AbstractFacadeImpl<ResourceDescriptor> {

    static final private Logger logger = LoggerFactory.getLogger(ResourceDescriptorFacade.class);
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

    /**
     *
     */
    public ResourceDescriptorFacade() {
        super(ResourceDescriptor.class);
    }

    /**
     *
     * @param resourceInstance
     * @param startTime
     * @param task
     */
    public void assign(ResourceInstance resourceInstance, Long startTime, TaskDescriptor task) {
        resourceInstance.assign(startTime, task);
    }

    /**
     *
     * @param player
     * @param resourceDescriptorId
     * @param startTime
     * @param taskId
     */
    public void assign(Player player, Long resourceDescriptorId, Long startTime, Long taskId) {
        this.assign(this.find(resourceDescriptorId).getInstance(player),
                startTime, (TaskDescriptor) variableDescriptorFacade.find(taskId));
    }

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }
}
