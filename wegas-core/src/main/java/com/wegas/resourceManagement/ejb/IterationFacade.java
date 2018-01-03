/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.ejb;

import com.wegas.core.api.IterationFacadeI;
import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
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

    public void reviveBurndownInstance(BurndownInstance burndownInstance) {
        BurndownDescriptor burndownDescriptor = (BurndownDescriptor) burndownInstance.findDescriptor();

        GameModel gameModel = burndownDescriptor.getGameModel();

        for (Iteration iteration : burndownInstance.getIterations()) {
            if (iteration.getDeserialisedTaskNames() != null) {

                /**
                 * remove old references
                 */
                for (TaskInstance instance : iteration.getTasks()) {
                    instance.getIterations().remove(iteration);
                }

                List<TaskInstance> tasks = new ArrayList<>();
                for (String taskName : iteration.getDeserialisedTaskNames()) {
                    try {
                        VariableDescriptor find = variableDescriptorFacade.find(gameModel, taskName);
                        if (find instanceof TaskDescriptor) {
                            TaskDescriptor theTask = (TaskDescriptor) find;
                            TaskInstance taskInstance = theTask.findInstance(burndownInstance, requestManager.getCurrentUser());

                            tasks.add(taskInstance);

                        } else {
                            throw WegasErrorMessage.error("Incompatible type, TaskDescriptor expected but " + find.getClass().getSimpleName() + " found");
                        }
                    } catch (WegasNoResultException ex) {
                        throw WegasErrorMessage.error("Task " + taskName + " not found");
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
