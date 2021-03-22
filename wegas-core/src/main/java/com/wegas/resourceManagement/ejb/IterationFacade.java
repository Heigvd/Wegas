/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
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
import com.wegas.resourceManagement.persistence.IterationEvent;
import com.wegas.resourceManagement.persistence.IterationPeriod;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.TaskInstance;
import java.util.ArrayList;
import java.util.List;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;

/**
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Stateless
@LocalBean
public class IterationFacade extends BaseFacade<Iteration> implements IterationFacadeI {

    //static final private Logger logger = LoggerFactory.getLogger(IterationFacade.class);

    /**
     *
     */
    @Inject
    private VariableInstanceFacade variableInstanceFacade;
    /**
     *
     */
    @Inject
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

    public IterationEvent findEvent(Long id) {
        return this.getEntityManager().find(IterationEvent.class, id);
    }

    public IterationPeriod findIterationPeriod(Long id) {
        return this.getEntityManager().find(IterationPeriod.class, id);
    }

    @Override
    public Iteration addIteration(BurndownInstance burndownInstance, Iteration iteration) {
        // Check iteration integrity
        burndownInstance.addIteration(iteration);
        iteration.getOrCreatePeriod(0l);
        if (iteration.getBeginAt() == null) {
            iteration.setBeginAt(1l);
        }
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

    private void touchDeltas(IterationPeriod period, double workload, double ac, double ev) {
        Double deltaAtStart = period.getDeltaAtStart();
        if (deltaAtStart == null) {
            deltaAtStart = 0.0;
        }
        period.setDeltaAtStart(deltaAtStart + workload);

        Double deltaAc = period.getDeltaAc();
        if (deltaAc == null) {
            deltaAc = 0.0;
        }
        period.setDeltaAc(deltaAc + ac);

        Double deltaEv = period.getDeltaEv();
        if (deltaEv == null) {
            deltaEv = 0.0;
        }
        period.setDeltaEv(deltaEv + ev);
    }

    @Override
    public void addTaskToIteration(TaskInstance task, Iteration iteration, double workload, long period, double ac, double ev) {
        long rPeriod = Math.max(iteration.getBeginAt(), period) - iteration.getBeginAt();

        IterationPeriod iPeriod = iteration.getOrCreatePeriod(rPeriod);
        touchDeltas(iPeriod, workload, ac, ev);

        IterationEvent iEvent = null;

        for (IterationEvent event : iPeriod.getIterationEvents()) {
            if (event.getTaskInstance().equals(task) && event.getEventType() == IterationEvent.EventType.REMOVE_TASK) {
                // adding a just remove task
                iEvent = event;
                break;
            }
        }
        if (iEvent != null) {
            iPeriod.removeEvent(iEvent);
        } else {
            iEvent = new IterationEvent();
            iEvent.setEventType(IterationEvent.EventType.ADD_TASK);
            iEvent.setStep(0);
            iEvent.setTaskInstance(task);
            iPeriod.addEvent(iEvent);
        }

        iteration.addTask(task);
        task.getIterations().add(iteration);
    }

    @Override
    public void addTaskToIteration(Long taskInstanceId, Long iterationId, double workload, long period, double ac, double ev) {
        this.addTaskToIteration((TaskInstance) variableInstanceFacade.find(taskInstanceId), this.find(iterationId), workload, period, ac, ev);
    }

    @Override
    public void removeTaskFromIteration(TaskInstance task, Iteration iteration, double workload, long period, double ac, double ev) {
        long rPeriod = Math.max(iteration.getBeginAt(), period) - iteration.getBeginAt();

        IterationPeriod iPeriod = iteration.getOrCreatePeriod(rPeriod);

        touchDeltas(iPeriod, -workload, -ac, -ev);

        IterationEvent iEvent = null;

        for (IterationEvent event : iPeriod.getIterationEvents()) {
            if (event.getTaskInstance().equals(task) && event.getEventType() == IterationEvent.EventType.ADD_TASK) {
                iEvent = event;
                break;
            }
        }
        if (iEvent != null) {
            iPeriod.removeEvent(iEvent);
        } else {
            iEvent = new IterationEvent();
            iEvent.setEventType(IterationEvent.EventType.REMOVE_TASK);
            iEvent.setStep(0);
            iEvent.setTaskInstance(task);
            iPeriod.addEvent(iEvent);
        }

        iteration.removeTask(task);
        task.getIterations().remove(iteration);
    }

    @Override
    public void removeTaskFromIteration(Long taskInstanceId, Long iterationId, double workload, long period, double ac, double ev) {
        this.removeTaskFromIteration((TaskInstance) variableInstanceFacade.find(taskInstanceId), this.find(iterationId), workload, period, ac, ev);
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

                for (IterationPeriod period : iteration.getPeriods()) {
                    for (IterationEvent event : period.getIterationEvents()) {
                        String taskName = event.getDeserialisedTaskName();
                        if (taskName != null) {
                            try {
                                TaskDescriptor theTask = (TaskDescriptor) variableDescriptorFacade.find(gameModel, taskName);
                                TaskInstance taskInstance = theTask.findInstance(burndownInstance, requestManager.getCurrentUser());
                                event.setTaskInstance(taskInstance);
                            } catch (WegasNoResultException ex) {
                                throw WegasErrorMessage.error("Task " + taskName + " not found");
                            }
                        }
                    }
                }
            }
        }
    }

    public Iteration replan(Long iterationId, Long periodNumber, double workload) {
        Iteration iteration = this.find(iterationId);
        IterationPeriod period = iteration.getOrCreatePeriod(periodNumber);

        period.setReplanned(workload);
        return iteration;
    }

    public Iteration plan(Long iterationId, Long periodNumber, double workload) {
        Iteration iteration = this.find(iterationId);
        IterationPeriod period = iteration.getOrCreatePeriod(periodNumber);

        if (iteration.isStarted()) {
            period.setReplanned(workload);
        } else {
            period.setPlanned(workload);
            period.setReplanned(workload);
        }
        return iteration;
    }
}
