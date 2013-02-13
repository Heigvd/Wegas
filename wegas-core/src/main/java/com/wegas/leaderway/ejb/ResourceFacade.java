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
import com.wegas.leaderway.persistence.ResourceInstance;
import com.wegas.leaderway.persistence.TaskDescriptor;
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
public class ResourceFacade  {

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


    /**
     *
     * @param resourceInstance
     * @param startTime
     * @param task
     */
    public void assign(ResourceInstance resourceInstance, Double startTime, TaskInstance task) {
        resourceInstance.assign(startTime, task);
    }
}
