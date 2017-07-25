/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
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

    Iteration addIteration(BurndownInstance burndownInstance, Iteration iteration);

    Iteration addIteration(Long burndownInstanceId, Iteration iteration);

    void addTaskToIteration(Long taskInstanceId, Long iterationId);

    void addTaskToIteration(TaskInstance task, Iteration iteration);

    /**
     *
     * find T instance by id
     *
     * @param entityId id to look for
     * @return entity matching given id
     */
    Iteration find(final Long entityId);

    void removeIteration(Long iterationId);

    void removeTaskFromIteration(Long taskInstanceId, Long iterationId);

    void removeTaskFromIteration(TaskInstance task, Iteration iteration);

}
