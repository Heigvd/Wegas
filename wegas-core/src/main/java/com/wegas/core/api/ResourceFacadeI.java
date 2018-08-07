/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.api;

import com.wegas.core.persistence.game.Player;
import com.wegas.resourceManagement.persistence.Activity;
import com.wegas.resourceManagement.persistence.Assignment;
import com.wegas.resourceManagement.persistence.Occupation;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.resourceManagement.persistence.WRequirement;

public interface ResourceFacadeI {

    /**
     * Add an occupation for a resource at the given time
     *
     * @param resourceInstanceId
     * @param editable
     * @param time
     *
     * @return the new resource occupation
     */
    Occupation addOccupation(Long resourceInstanceId, Boolean editable, Integer time);

    /**
     * Assign a resource to a task
     *
     * @param resourceInstanceId
     * @param taskInstanceId
     *
     * @return the new assignment
     */
    Assignment assign(Long resourceInstanceId, Long taskInstanceId);

    /**
     * Change activity sub requirements. If a resource continue to work on the
     * same task, but on a different requirements,
     * <p>
     * THIS BEHAVIOUR SHOULD NOT EXIST. IMO, different req means different
     * activity
     *
     * @param activity
     * @param newReq
     */
    void changeActivityReq(Activity activity, WRequirement newReq);

    /**
     * @param activityId
     * @param newReqId
     */
    void changeActivityReq(Long activityId, Long newReqId);

    /**
     * Create an Activity (ie. a resourceInstance worked on a specific
     * taskInstance)
     *
     * @param resourceInstanceId
     * @param taskInstanceId
     *
     * @return the new activity
     */
    Activity createActivity(Long resourceInstanceId, Long taskInstanceId);

    /**
     *
     * @param id
     *
     * @return assignment identified by id
     */
    Assignment findAssignment(Long id);

    /**
     * Is the given resource assign to the given task descriptor ?
     *
     * @param resourceId     resourceInstance id
     * @param taskInstanceId taskInstance id
     *
     * @return the assignment id resource is assigned to the task, null
     *         otherwise
     */
    Assignment findAssignment(Long resourceId, Long taskInstanceId);

    /**
     *
     * @param id
     *
     * @return occupation identified by id
     */
    Occupation findOccupation(Long id);

    WRequirement findRequirement(Long id);

    /**
     * Change assignment priority
     *
     * @param assignmentId
     * @param index
     *
     * @return assigned resource containing assignment in the new order
     */
    ResourceInstance moveAssignment(final Long assignmentId, final Integer index);

    /**
     * plan a taskInstance at a specific period
     *
     * @param playerId
     * @param taskInstanceId
     * @param period
     *
     * @return the taskInstance, which contains the new planning
     */
    TaskInstance plan(Long playerId, Long taskInstanceId, Integer period);

    /**
     *
     * plan a taskInstance at a specific period
     *
     * @param player
     * @param taskInstanceId
     * @param period
     *
     * @return the taskInstance, which contains the new planning
     */
    TaskInstance plan(Player player, Long taskInstanceId, Integer period);

    /**
     * Remove
     *
     * @param assignment
     *
     * @return the resource instance who was assigned, with the updated list of
     *         assignments
     */
    ResourceInstance removeAssignment(Assignment assignment);

    /**
     * Remove an assignment
     *
     * @param assignmentId
     *
     * @return the resource instance who was assigned, with the updated list of
     *         assignments
     */
    ResourceInstance removeAssignment(final Long assignmentId);

    /**
     * Remove an occupation
     *
     * @param occupationId
     */
    void removeOccupation(Long occupationId);

    /**
     *
     * @param playerId
     * @param taskInstanceId
     * @param period
     *
     * @return the taskInstance, which contains the new planning
     */
    TaskInstance unplan(Long playerId, Long taskInstanceId, Integer period);

    /**
     *
     * @param player
     * @param taskInstanceId
     * @param period
     *
     * @return the taskInstance, which contains the new planning
     */
    TaskInstance unplan(Player player, Long taskInstanceId, Integer period);
    
}