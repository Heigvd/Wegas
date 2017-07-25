/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.ejb;

import com.wegas.core.Helper;
import com.wegas.core.api.IterationFacadeI;
import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.event.internal.InstanceRevivedEvent;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.resourceManagement.persistence.BurndownDescriptor;
import com.wegas.resourceManagement.persistence.BurndownInstance;
import com.wegas.resourceManagement.persistence.Iteration;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.TaskInstance;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.naming.NamingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Stateless
@LocalBean
public class IterationFacade extends BaseFacade<Iteration> implements IterationFacadeI {

    static final private Logger logger = LoggerFactory.getLogger(IterationFacade.class);

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

    @Override
    public Iteration addIteration(BurndownInstance burndownInstance, Iteration iteration) {
        // Check iteration integrity
        burndownInstance.addIteration(iteration);
        return iteration;
    }

    @Override
    public Iteration addIteration(Long burndownInstanceId, Iteration iteration) {
        return this.addIteration(this.findBurndownInstance(burndownInstanceId), iteration);
    }

    @Override
    public void removeIteration(Long iterationId) {
        Iteration findIteration = this.find(iterationId);
        getEntityManager().remove(findIteration);
    }

    @Override
    public void addTaskToIteration(TaskInstance task, Iteration iteration) {
        iteration.addTask(task);
        task.getIterations().add(iteration);
    }

    @Override
    public void addTaskToIteration(Long taskInstanceId, Long iterationId) {
        this.addTaskToIteration((TaskInstance) variableInstanceFacade.find(taskInstanceId), this.find(iterationId));
    }

    @Override
    public void removeTaskFromIteration(TaskInstance task, Iteration iteration) {
        iteration.removeTask(task);
        task.getIterations().remove(iteration);
    }

    @Override
    public void removeTaskFromIteration(Long taskInstanceId, Long iterationId) {
        this.removeTaskFromIteration((TaskInstance) variableInstanceFacade.find(taskInstanceId), this.find(iterationId));
    }

    @Override
    public void create(Iteration entity) {
        getEntityManager().persist(entity);
    }

    @Override
    public void remove(Iteration entity) {
        getEntityManager().remove(entity);
    }

    public void instanceRevivedListener(@Observes InstanceRevivedEvent event) throws WegasNoResultException, NoPlayerException {
        if (event.getEntity() instanceof BurndownInstance) {
            BurndownInstance burndownInstance = (BurndownInstance) event.getEntity();
            BurndownDescriptor burndownDescriptor = (BurndownDescriptor) burndownInstance.findDescriptor();

            GameModel gameModel = burndownDescriptor.getGameModel();

            for (Iteration iteration : burndownInstance.getIterations()) {
                if (iteration.getDeserialisedNames() != null) {

                    /**
                     * remove old references
                     */
                    for (TaskInstance instance : iteration.getTasks()) {
                        instance.getIterations().remove(iteration);
                    }

                    List<TaskInstance> tasks = new ArrayList<>();
                    for (String taskName : iteration.getDeserialisedNames()) {
                        VariableDescriptor find = variableDescriptorFacade.find(gameModel, taskName);
                        if (find instanceof TaskDescriptor) {
                            TaskDescriptor theTask = (TaskDescriptor) find;
                            TaskInstance taskInstance = (TaskInstance) variableInstanceFacade.findInstance(theTask, burndownInstance);

                            tasks.add(taskInstance);

                        } else {
                            throw WegasErrorMessage.error("Incompatible type, TaskDescriptor expected but " + find.getClass().getSimpleName() + " found");
                        }
                    }
                    /**
                     * setup new references
                     */
                    iteration.setTasks(tasks);
                }
            }
        }
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
