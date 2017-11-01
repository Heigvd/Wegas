/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.ScriptEventFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.event.internal.DescriptorRevivedEvent;
import com.wegas.core.event.internal.InstanceRevivedEvent;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.NoPlayerException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.resourceManagement.persistence.Activity;
import com.wegas.resourceManagement.persistence.Assignment;
import com.wegas.resourceManagement.persistence.Occupation;
import com.wegas.resourceManagement.persistence.ResourceDescriptor;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.resourceManagement.persistence.WRequirement;
import java.util.List;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.enterprise.event.Observes;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class ResourceFacade {

    static final private Logger logger = LoggerFactory.getLogger(ResourceFacade.class);

    private EntityManager getEntityManager() {
        return requestManager.getEntityManager();
    }

    /**
     *
     */
    public ResourceFacade() {
    }
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
    /**
     *
     */
    @Inject
    private ScriptEventFacade scriptEvent;

    @Inject
    private RequestManager requestManager;

    /**
     *
     * @param id
     *
     * @return occupation identified by id
     */
    public Occupation findOccupation(Long id) {
        return getEntityManager().find(Occupation.class, id);
    }

    /**
     *
     * @param id
     *
     * @return activity identified by id
     */
    public Activity findActivity(Long id) {
        return getEntityManager().find(Activity.class, id);
    }

    /**
     *
     * @param id
     *
     * @return assignment identified by id
     */
    public Assignment findAssignment(Long id) {
        return getEntityManager().find(Assignment.class, id);
    }

    public WRequirement findRequirement(Long id) {
        return getEntityManager().find(WRequirement.class, id);
    }

    /**
     * Is the given resource assign to the given task descriptor ?
     *
     * @param resourceId     resourceInstance id
     * @param taskInstanceId taskInstance id
     *
     * @return the assignment id resource is assigned to the task, null
     *         otherwise
     */
    public Assignment findAssignment(Long resourceId, Long taskInstanceId) {
        EntityManager em = getEntityManager();
        TypedQuery<Assignment> query = em.createNamedQuery("Assignment.findByResourceInstanceIdAndTaskInstanceId", Assignment.class).
                setParameter("resourceInstanceId", resourceId).
                setParameter("taskInstanceId", taskInstanceId);
        return query.getSingleResult();
    }

    /**
     * Find a taskInstance by id
     *
     * @param id task instance id
     *
     * @return task instance matching id
     */
    public TaskInstance findTaskInstance(Long id) {
        return getEntityManager().find(TaskInstance.class, id);
    }

    /**
     * Assign a resource to a task
     *
     * @param resourceInstanceId
     * @param taskInstanceId
     *
     * @return the new assignment
     */
    public Assignment assign(Long resourceInstanceId, Long taskInstanceId) {
        ResourceInstance resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstanceId);
        TaskInstance taskInstance = (TaskInstance) variableInstanceFacade.find(taskInstanceId);

        final Assignment assignment = new Assignment();
        resourceInstance.addAssignment(assignment);
        taskInstance.addAssignment(assignment);

        return assignment;
    }

    /**
     * Change assignment priority
     *
     * @param assignmentId
     * @param index
     *
     * @return assigned resource containing assignment in the new order
     */
    public ResourceInstance moveAssignment(final Long assignmentId, final int index) {
        final Assignment assignment = this.findAssignment(assignmentId);
        ResourceInstance resourceInstance = (ResourceInstance) variableInstanceFacade.find(assignment.getResourceInstance().getId());
        resourceInstance.moveAssignment(assignment, index);
        return resourceInstance;
    }

    /**
     * Remove an assignment
     *
     * @param assignmentId
     *
     * @return the resource instance who was assigned, with the updated list of
     *         assignments
     */
    public ResourceInstance removeAssignment(final Long assignmentId) {
        final Assignment assignment = this.getEntityManager().find(Assignment.class, assignmentId);
        return this.removeAssignment(assignment);
    }

    /**
     * Remove
     *
     * @param assignment
     *
     * @return the resource instance who was assigned, with the updated list of
     *         assignments
     */
    public ResourceInstance removeAssignment(Assignment assignment) {
        ResourceInstance resourceInstance = (ResourceInstance) variableInstanceFacade.find(assignment.getResourceInstance().getId());
        TaskInstance taskInstance = (TaskInstance) variableInstanceFacade.find(assignment.getTaskInstance().getId());

        taskInstance.removeAssignment(assignment);
        resourceInstance.removeAssignment(assignment);

        this.getEntityManager().remove(assignment);

        return resourceInstance;
    }

    /**
     * Create an Activity (ie. a resourceInstance worked on a specific
     * taskInstance)
     *
     * @param resourceInstanceId
     * @param taskInstanceId
     *
     * @return the new activity
     */
    public Activity createActivity(Long resourceInstanceId, Long taskInstanceId) {
        ResourceInstance resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstanceId);
        TaskInstance taskInstance = (TaskInstance) variableInstanceFacade.find(taskInstanceId);

        final Activity activity = new Activity();
        resourceInstance.addActivity(activity);
        taskInstance.addActivity(activity);

        return activity;
    }

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
    public void changeActivityReq(Activity activity, WRequirement newReq) {
        WRequirement oldReq = activity.getRequirement();
        if (oldReq != null) {
            oldReq.removeActivity(activity);
        }
        newReq.addActivity(activity);
    }

    /**
     * @param activityId
     * @param newReqId
     */
    public void changeActivityReq(Long activityId, Long newReqId) {
        this.changeActivityReq(this.findActivity(activityId), this.findRequirement(newReqId));
    }

    /**
     * Destroy an activity
     *
     * @param activityId id of activity to destroy
     *
     */
    public void deleteActivity(Long activityId) {
        Activity activity = this.findActivity(activityId);
        activity.getResourceInstance().removeActivity(activity);
        activity.getRequirement().removeActivity(activity);
        activity.getTaskInstance().removeActivity(activity);

        this.getEntityManager().remove(activity);
    }

    /**
     * Add an occupation for a resource at the given time
     *
     * @param resourceInstanceId
     * @param editable
     * @param time
     *
     * @return the new resource occupation
     */
    public Occupation addOccupation(Long resourceInstanceId,
            Boolean editable,
            double time) {
        ResourceInstance resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstanceId);
        Occupation newOccupation = new Occupation(time);
        newOccupation.setEditable(editable);

        resourceInstance.addOccupation(newOccupation);

        return newOccupation;
    }

    /**
     * Remove an occupation
     *
     * @param occupationId
     */
    public void removeOccupation(Long occupationId) {
        Occupation occupation = this.findOccupation(occupationId);
        occupation.getResourceInstance().removeOccupation(occupation);
    }

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
    public TaskInstance plan(Player player, Long taskInstanceId, Integer period) {
        TaskInstance ti = findTaskInstance(taskInstanceId);
        List<Integer> plannedPeriods = ti.getPlannification();
        if (!plannedPeriods.contains(period)) {
            plannedPeriods.add(period);
        }
        try {
            scriptEvent.fire(player, "addTaskPlannification");
        } catch (WegasScriptException ex) {
            logger.error("EventListener error (\"addTaskPlannification\")", ex);
        }
        return ti;
    }

    /**
     * plan a taskInstance at a specific period
     *
     * @param playerId
     * @param taskInstanceId
     * @param period
     *
     * @return the taskInstance, which contains the new planning
     */
    public TaskInstance plan(Long playerId, Long taskInstanceId, Integer period) {
        Player player = playerFacade.find(playerId);
        requestManager.lock("TaskPlan-" + taskInstanceId);
        return plan(player, taskInstanceId, period);
    }

    /**
     *
     * @param player
     * @param taskInstanceId
     * @param period
     *
     * @return the taskInstance, which contains the new planning
     */
    public TaskInstance unplan(Player player, Long taskInstanceId, Integer period) {
        TaskInstance ti = findTaskInstance(taskInstanceId);
        ti.getPlannification().remove(period);
        try {
            scriptEvent.fire(player, "removeTaskPlannification");
        } catch (WegasScriptException ex) {
            logger.error("EventListener error (\"removePlannification\")", ex);
        }
        return ti;
    }

    /**
     *
     * @param playerId
     * @param taskInstanceId
     * @param period
     *
     * @return the taskInstance, which contains the new planning
     */
    public TaskInstance unplan(Long playerId, Long taskInstanceId, Integer period) {
        Player player = playerFacade.find(playerId);
        requestManager.lock("TaskPlan-" + taskInstanceId);
        return this.unplan(player, taskInstanceId, period);
    }

    /**
     *
     * @param event
     *
     * @throws com.wegas.core.exception.internal.WegasNoResultException
     */
    public void descriptorRevivedEvent(@Observes DescriptorRevivedEvent event) throws WegasNoResultException {
        logger.debug("Received DescriptorRevivedEvent event");
        if (event.getEntity() instanceof TaskDescriptor) {
            TaskDescriptor task = (TaskDescriptor) event.getEntity();
            Double duration = task.getDefaultInstance().getDuration();
            if (duration != null) {
                // BACKWARD
                task.getDefaultInstance().setProperty("duration", duration.toString());
            }

            /**
             * Transform task name into real TaskDescriptor
             */
            if (task.getImportedPredecessorNames() != null) {
                /**
                 * New predecessor's names : be sure they're registered
                 */
                for (String predecessorName : task.getImportedPredecessorNames()) {
                    TaskDescriptor predecessor = (TaskDescriptor) variableDescriptorFacade.find(task.getGameModel(), predecessorName);
                    if (!task.getPredecessorNames().contains(predecessorName)) {
                        task.addPredecessor(predecessor);
                    }
                }
                /**
                 * Old predecessor's names : make sure to remove oldies
                 */
                for (String predecessorName : task.getPredecessorNames()) {
                    TaskDescriptor predecessor = (TaskDescriptor) variableDescriptorFacade.find(task.getGameModel(), predecessorName);
                    if (!task.getImportedPredecessorNames().contains(predecessorName)) {
                        task.removePredecessor(predecessor);
                    }
                }
            }
            //this.setPredecessors(ListUtils.updateList(this.getPredecessors(), other.getPredecessors()));

        } else if (event.getEntity() instanceof ResourceDescriptor) {
            // BACKWARD COMPAT
            ResourceInstance ri = (ResourceInstance) event.getEntity().getDefaultInstance();
            Integer moral = ri.getMoral();
            if (moral != null) {
                ri.setProperty("motivation", moral.toString());
            }
            Map<String, Long> skills = ri.getDeserializedSkillsets();
            if (skills != null && skills.size() > 0) {
                Long level = (Long) skills.values().toArray()[0];
                ri.setProperty("level", level.toString());
            }
        }
    }

    public void instanceRevivedListener(@Observes InstanceRevivedEvent event) throws WegasNoResultException, NoPlayerException {
        if (event.getEntity() instanceof ResourceInstance) {
            this.reviveResourceInstance((ResourceInstance) event.getEntity());
        }
    }

    public void reviveResourceInstance(ResourceInstance resourceInstance) throws WegasNoResultException, NoPlayerException {

        if ((resourceInstance.getAssignments() != null && resourceInstance.getAssignments().size() > 0)
                || (resourceInstance.getActivities() != null && resourceInstance.getActivities().size() > 0)) {
            ResourceDescriptor rd = (ResourceDescriptor) resourceInstance.findDescriptor();
            GameModel gm = rd.getGameModel();

            for (Assignment assignment : resourceInstance.getAssignments()) {
                String taskDescriptorName = assignment.getTaskDescriptorName();
                if (!Helper.isNullOrEmpty(taskDescriptorName)) {
                    TaskDescriptor newTaskDescriptor = (TaskDescriptor) variableDescriptorFacade.find(gm, taskDescriptorName);
                    
                    
                    TaskInstance newTaskInstance = newTaskDescriptor.findInstance(resourceInstance);
                    TaskInstance oldTaskInstance = assignment.getTaskInstance();

                    if (oldTaskInstance != null) {
                        oldTaskInstance.removeAssignment(assignment);
                    }
                    assignment.setTaskInstance(newTaskInstance);
                    newTaskInstance.addAssignment(assignment);
                }
            }

            for (Activity activity : resourceInstance.getActivities()) {
                String taskDescriptorName = activity.getTaskDescriptorName();
                if (!Helper.isNullOrEmpty(taskDescriptorName)) {
                    TaskDescriptor newTaskDescriptor = (TaskDescriptor) variableDescriptorFacade.find(gm, taskDescriptorName);
                    
                    TaskInstance newTaskInstance = newTaskDescriptor.findInstance(resourceInstance);

                    TaskInstance oldTaskInstance = activity.getTaskInstance();
                    if (oldTaskInstance != null) {
                        oldTaskInstance.removeActivity(activity);
                    }
                    activity.setTaskInstance(newTaskInstance);
                    newTaskInstance.addActivity(activity);
                }

                // Process req after the taskInstance
                if (!Helper.isNullOrEmpty(activity.getRequirementName())) {
                    String reqName = activity.getRequirementName();
                    if (activity.getTaskInstance() != null) {
                        WRequirement req = activity.getTaskInstance().getRequirementByName(reqName);
                        if (req != null) {
                            activity.setRequirement(req);
                        }
                    } else {
                        throw WegasErrorMessage.error("Invalid Activity (no task)");
                    }
                }
            }
        }
    }
}
