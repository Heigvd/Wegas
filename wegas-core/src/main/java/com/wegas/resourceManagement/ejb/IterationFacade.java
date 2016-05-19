/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.resourceManagement.persistence.BurndownDescriptor;
import com.wegas.resourceManagement.persistence.BurndownInstance;
import com.wegas.resourceManagement.persistence.Iteration;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.naming.NamingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Stateless
@LocalBean
public class IterationFacade extends BaseFacade<Iteration> {

    static final private Logger logger = LoggerFactory.getLogger(IterationFacade.class);

    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;
    /**
     *
     */
    @EJB
    private VariableInstanceFacade variableInstanceFacade;
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;

    public IterationFacade() {
        super(Iteration.class);
    }

    public BurndownDescriptor findBurndownDescriptor(Long burndownDescriptorId) {
        return (BurndownDescriptor) variableDescriptorFacade.find(burndownDescriptorId);
    }

    public BurndownInstance findBurndownInstance(Long burndownInstanceId) {
        return (BurndownInstance) variableInstanceFacade.find(burndownInstanceId);
    }

    public Iteration addIteration(BurndownInstance burndownInstance, Iteration iteration) {
        // Check iteration integrity
        burndownInstance.addIteration(iteration);
        return iteration;
    }

    public Iteration addIteration(Long burndownInstanceId, Iteration iteration) {
        BurndownInstance findBurndownInstance = this.findBurndownInstance(burndownInstanceId);
        return this.addIteration(findBurndownInstance, iteration);
    }

    public void removeIteration(Long iterationId) {
        Iteration findIteration = this.find(iterationId);
        getEntityManager().remove(findIteration);
    }

    public void addTaskToIteration(TaskDescriptor task, Iteration iteration) {
        iteration.addTask(task);
        task.getIterations().add(iteration);
    }

    public void removeTaskFromIteration(TaskDescriptor task, Iteration iteration) {
        iteration.removeTask(task);
        task.getIterations().remove(iteration);
    }

    @Override
    public void create(Iteration entity) {
        getEntityManager().persist(entity);
    }

    @Override
    public void remove(Iteration entity) {
        getEntityManager().remove(entity);
    }

    /**
     * @return fetch IterationFacade EJB
     */
    public static IterationFacade lookup() {
        try {
            return Helper.lookupBy(IterationFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving var desc facade", ex);
            return null;
        }
    }
}
