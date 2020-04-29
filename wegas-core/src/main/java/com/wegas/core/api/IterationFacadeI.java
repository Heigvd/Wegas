/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.resourceManagement.persistence.BurndownInstance;
import com.wegas.resourceManagement.persistence.Iteration;
import com.wegas.resourceManagement.persistence.TaskInstance;

/**
 *
 * @author maxence
 */
public interface IterationFacadeI {

    /**
     * Create iteration within the burndown instance
     *
     * @param burndownInstance
     * @param iteration
     *
     * @return the just persisted iteration
     */
    Iteration addIteration(BurndownInstance burndownInstance, Iteration iteration);

    /**
     * same as {@link #addIteration(com.wegas.resourceManagement.persistence.BurndownInstance, com.wegas.resourceManagement.persistence.Iteration)
     * }
     *
     * @param burndownInstanceId
     * @param iteration
     *
     * @return
     */
    Iteration addIteration(Long burndownInstanceId, Iteration iteration);

    /**
     * See {@link #addTaskToIteration(com.wegas.resourceManagement.persistence.TaskInstance, com.wegas.resourceManagement.persistence.Iteration, double, long, double, double) }
     *
     * @param taskInstanceId id of the task
     * @param iterationId    id of the iteration
     * @param workload       remaining workload
     * @param period         absolute period
     * @param ac             actual cost change
     * @param ev             earned value change
     */
    void addTaskToIteration(Long taskInstanceId, Long iterationId, double workload, long period, double ac, double ev);

    /**
     * Add a task instance in an iteration
     *
     * @param task      the task to add
     * @param iteration iteration to add the task in
     * @param workload  remaining workload
     * @param period    absolute period
     * @param ac        actual cost change
     * @param ev        earned value change
     */
    void addTaskToIteration(TaskInstance task, Iteration iteration, double workload, long period, double ac, double ev);

    /**
     * find an iteration by id
     *
     * @param entityId id to look for
     *
     * @return entity matching given id
     */
    Iteration find(final Long entityId);

    /**
     * Delete an iteration, identified by its id
     *
     * @param iterationId id of the iteration to delete
     */
    void removeIteration(Long iterationId);

    /**
     * same as {@link #removeTaskFromIteration(com.wegas.resourceManagement.persistence.TaskInstance, com.wegas.resourceManagement.persistence.Iteration, double, long, double, double) }
     *
     * @param taskInstanceId id of the task to remove
     * @param iterationId    id of the iteration to remove the task from
     * @param workload       remaining workload
     * @param period         absolute period
     * @param ac             actual cost change
     * @param ev             earned value change
     */
    void removeTaskFromIteration(Long taskInstanceId, Long iterationId, double workload, long period, double ac, double ev);

    /**
     *
     * Remove a task from an iteration
     *
     * @param task      the task to remove
     * @param iteration iteration to remove the task from
     * @param workload  remaining workload
     * @param period    absolute period
     * @param ac        actual cost change
     * @param ev        earned value change
     */
    void removeTaskFromIteration(TaskInstance task, Iteration iteration, double workload, long period, double ac, double ev);

}
