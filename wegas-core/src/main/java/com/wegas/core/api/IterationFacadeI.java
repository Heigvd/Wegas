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
     * same as {@link #addIteration(com.wegas.resourceManagement.persistence.BurndownInstance, com.wegas.resourceManagement.persistence.Iteration) }
     *
     * @param burndownInstanceId
     * @param iteration
     *
     * @return
     */
    Iteration addIteration(Long burndownInstanceId, Iteration iteration);

    /**
     * {@link #addTaskToIteration(com.wegas.resourceManagement.persistence.TaskInstance, com.wegas.resourceManagement.persistence.Iteration) }
     *
     * @param taskInstanceId id of the task
     * @param iterationId    id of the iteration
     */
    void addTaskToIteration(Long taskInstanceId, Long iterationId);

    /**
     * Add a task instance in an iteration
     *
     * @param task      the task to add
     * @param iteration iteration to add the task in
     */
    void addTaskToIteration(TaskInstance task, Iteration iteration);

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
     * same as {@link #removeTaskFromIteration(com.wegas.resourceManagement.persistence.TaskInstance, com.wegas.resourceManagement.persistence.Iteration) }
     *
     * @param taskInstanceId id of the task to remove
     * @param iterationId    id of the iteration to remove the task from
     */
    void removeTaskFromIteration(Long taskInstanceId, Long iterationId);

    /**
     *
     * Remove a task from an iteration
     *
     * @param task      the task to remove
     * @param iteration iteration to remove the task from
     */
    void removeTaskFromIteration(TaskInstance task, Iteration iteration);

}
