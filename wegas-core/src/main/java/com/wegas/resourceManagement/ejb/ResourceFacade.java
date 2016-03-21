/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.ejb;

import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.ScriptEventFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.event.internal.DescriptorRevivedEvent;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Player;
import com.wegas.resourceManagement.persistence.AbstractAssignement;
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
import javax.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class ResourceFacade {

    static final private Logger logger = LoggerFactory.getLogger(ResourceFacade.class);
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    private EntityManager getEntityManager() {
        return em;
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

    /**
     *
     * @param id
     * @return
     */
    public Occupation findOccupation(Long id) {
        return getEntityManager().find(Occupation.class, id);
    }

    /**
     *
     * @param id
     * @return
     */
    public Activity findActivity(Long id) {
        return getEntityManager().find(Activity.class, id);
    }

    /**
     *
     * @param id
     * @return
     */
    public Assignment findAssignment(Long id) {
        return getEntityManager().find(Assignment.class, id);
    }

    /**
     *
     * @param id
     * @return
     */
    public TaskInstance findTaskInstance(Long id) {
        return getEntityManager().find(TaskInstance.class, id);
    }

    /**
     *
     * @param resourceInstanceId
     * @param taskDescriptorId
     * @return
     */
    public Assignment assign(Long resourceInstanceId, Long taskDescriptorId) {
        ResourceInstance resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstanceId);
        TaskDescriptor taskDescriptor = (TaskDescriptor) variableDescriptorFacade.find(taskDescriptorId);

        final Assignment assignment = new Assignment(taskDescriptor);
        resourceInstance.addAssignment(assignment);
        taskDescriptor.addAssignment(assignment);

        return assignment;
    }

    /**
     *
     * @param assignmentId
     * @param index
     * @return
     */
    public ResourceInstance moveAssignment(final Long assignmentId, final int index) {
        final Assignment assignment = this.getEntityManager().find(Assignment.class, assignmentId);
        assignment.getResourceInstance().getAssignments().remove(assignment);
        assignment.getResourceInstance().getAssignments().add(index, assignment);
        return assignment.getResourceInstance();
    }

    /**
     *
     * @param assignmentId
     * @return
     */
    public ResourceInstance removeAssignment(final Long assignmentId) {
        final Assignment assignment = this.getEntityManager().find(Assignment.class, assignmentId);
        assignment.getResourceInstance().removeAssignment(assignment);
        assignment.getTaskDescriptor().removeAssignment(assignment);
        return assignment.getResourceInstance();
    }

    /**
     *
     * @param resourceInstanceId
     * @param taskDescriptorId
     * @return
     */
    public Activity createActivity(Long resourceInstanceId, Long taskDescriptorId) {
        ResourceInstance resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstanceId);
        TaskDescriptor taskDescriptor = (TaskDescriptor) variableDescriptorFacade.find(taskDescriptorId);

        final Activity activity = new Activity();
        resourceInstance.addActivity(activity);
        taskDescriptor.addActivity(activity);

        return activity;
    }

    public void changeActivityReq(Activity activity, WRequirement newReq) {
        WRequirement oldReq = activity.getRequirement();
        if (oldReq != null) {
            oldReq.removeActivity(activity);
        }
        newReq.addActivity(activity);
    }

    public void deleteActivity(Long activityId) {
        Activity activity = this.findActivity(activityId);
        activity.getResourceInstance().removeActivity(activity);
        activity.getRequirement().removeActivity(activity);
        activity.getTaskDescriptor().removeActivity(activity);
    }

    /**
     * Add an occupation for a resource at the given time
     *
     * @param resourceInstanceId
     * @param editable
     * @param time
     * @return
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

    public void removeOccupation(Long occupationId) {
        Occupation occupation = this.findOccupation(occupationId);
        occupation.getResourceInstance().removeOccupation(occupation);
    }

    /**
     *
     * @param player
     * @param taskInstanceId
     * @param period
     * @return
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
     *
     * @param playerId
     * @param taskInstanceId
     * @param period
     * @return
     */
    public TaskInstance plan(Long playerId, Long taskInstanceId, Integer period) {
        return plan(playerFacade.find(playerId), taskInstanceId, period);
    }

    /**
     *
     * @param player
     * @param taskInstanceId
     * @param period
     * @return
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
     * @return
     */
    public TaskInstance unplan(Long playerId, Long taskInstanceId, Integer period) {
        return this.unplan(playerFacade.find(playerId), taskInstanceId, period);
    }

    /**
     *
     * @param event
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
            for (String predecessorName : task.getImportedPredecessorNames()) {
                TaskDescriptor predecessor = (TaskDescriptor) variableDescriptorFacade.find(task.getGameModel(), predecessorName);
                task.addPredecessor(predecessor);
            }
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
}
