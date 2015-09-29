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
     * @param resourceInstance
     * @param taskDescriptor
     * @return
     */
    public Assignment assign(ResourceInstance resourceInstance, TaskDescriptor taskDescriptor) {
        resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstance.getId());
        return resourceInstance.assign(taskDescriptor);
    }

    /**
     *
     * @param resourceInstanceId
     * @param taskDescriptorId
     * @return
     */
    public Assignment assign(Long resourceInstanceId, Long taskDescriptorId) {
        return this.assign((ResourceInstance) variableInstanceFacade.find(resourceInstanceId), (TaskDescriptor) variableDescriptorFacade.find(taskDescriptorId));
    }

    /**
     *
     * @param resourceInstance
     * @param taskDescriptor
     * @return
     */
    public Activity createActivity(ResourceInstance resourceInstance, TaskDescriptor taskDescriptor) {
        resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstance.getId());
        return resourceInstance.createActivity(taskDescriptor);
    }

    /**
     *
     * @param resourceInstanceId
     * @param taskDescriptorId
     * @return
     */
    public Activity createActivity(Long resourceInstanceId, Long taskDescriptorId) {
        return this.createActivity((ResourceInstance) variableInstanceFacade.find(resourceInstanceId),
                (TaskDescriptor) variableDescriptorFacade.find(taskDescriptorId));
    }

    /**
     * Add an occupation for a resource at the given time
     *
     * @param resourceInstance
     * @param editable
     * @param time
     * @return
     */
    public Occupation addOccupation(ResourceInstance resourceInstance,
            Boolean editable,
            double time) {
        Occupation newOccupation = new Occupation(time);
        newOccupation.setEditable(editable);

        this.addAbstractAssignement(resourceInstance.getId(), newOccupation);
        return newOccupation;
    }

    /**
     * Reserve a resource for the given time
     *
     * @param resourceInstance
     * @param time
     * @return
     */
    public Occupation reserve(ResourceInstance resourceInstance,
            double time) {
        return addOccupation(resourceInstance, true, time);
    }

    /**
     *
     * @param resourceInstance
     * @param editable
     * @return
     */
    public Occupation addOccupation(ResourceInstance resourceInstance, Boolean editable) {
        Occupation occupation = this.addOccupation(resourceInstance);
        occupation.setEditable(editable);
        return occupation;
    }

    /**
     *
     * @param resourceInstance
     * @return
     */
    public Occupation addOccupation(ResourceInstance resourceInstance) {
        resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstance.getId());
        Occupation occupation = resourceInstance.addOccupation();
        return occupation;
    }

    /**
     *
     * @param resourceInstanceId
     * @return
     */
    public Occupation addOccupation(Long resourceInstanceId) {
        ResourceInstance resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstanceId);
        return resourceInstance.addOccupation();
    }

    /**
     *
     * @param assignementId
     * @param index
     * @return
     */
    public ResourceInstance moveAssignment(final Long assignementId, final int index) {
        final Assignment assignement = this.getEntityManager().find(Assignment.class, assignementId);
        assignement.getResourceInstance().getAssignments().remove(assignement);
        assignement.getResourceInstance().getAssignments().add(index, assignement);
        return assignement.getResourceInstance();
    }

    /**
     *
     * @param assignementId
     * @return
     */
    public ResourceInstance removeAssignment(final Long assignementId) {
        final Assignment assignement = this.getEntityManager().find(Assignment.class, assignementId);
        assignement.getResourceInstance().getAssignments().remove(assignement);
        return assignement.getResourceInstance();
    }

    /**
     *
     * @param requirement
     * @param taskInstanceId
     * @return
     */
    public TaskInstance addRequierement(WRequirement requirement, Long taskInstanceId) {
        TaskInstance ti = (TaskInstance) variableInstanceFacade.find(taskInstanceId);
        ti.getRequirements().add(requirement);
        return ti;
    }

    /**
     *
     * @param resourceInstanceId
     * @param abstractAssignement
     * @return
     */
    public ResourceInstance addAbstractAssignement(Long resourceInstanceId, AbstractAssignement abstractAssignement) {
        ResourceInstance res = (ResourceInstance) variableInstanceFacade.find(resourceInstanceId);
        if (abstractAssignement instanceof Occupation) {
            Occupation o = (Occupation) abstractAssignement;
            res.addOccupation(o);
        } else if (abstractAssignement instanceof Assignment) {
            Assignment a = (Assignment) abstractAssignement;
            res.addAssignement(a);
        } else {
            Activity a = (Activity) abstractAssignement;
            res.addActivity(a);
        }
        return res;
    }

    /**
     *
     * @param abstractAssignementId
     * @param type
     */
    public void removeAbstractAssignement(Long abstractAssignementId, String type) {
        switch (type) {
            case "occupations":
                Occupation o = this.findOccupation(abstractAssignementId);
                o.getResourceInstance().getOccupations().remove(o);
               // getEntityManager().remove(o);
                break;
            case "assignment":
                Assignment a = this.findAssignment(abstractAssignementId);
                a.getResourceInstance().getAssignments().remove(a);
//                getEntityManager().remove(a);
                break;
            default:
                Activity ac = this.findActivity(abstractAssignementId);
                ac.getResourceInstance().getActivities().remove(ac);
//                getEntityManager().remove(ac);
        }
    }

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
                task.addPredecessor((TaskDescriptor) variableDescriptorFacade.find(task.getGameModel(), predecessorName));
            }
        } else if (event.getEntity() instanceof ResourceDescriptor) {
            // BACKWARD COMPAT
            ResourceInstance ri = (ResourceInstance) event.getEntity().getDefaultInstance();
            Integer moral = ri.getMoral();
            if (moral != null){
                ri.setProperty("motivation", moral.toString());
            }
            Map<String, Long> skills = ri.getDeserializedSkillsets() ;
            if (skills != null && skills.size() > 0) {
                Long level = (Long) skills.values().toArray()[0];
                ri.setProperty("level", level.toString());
            }
        }
    }
}
