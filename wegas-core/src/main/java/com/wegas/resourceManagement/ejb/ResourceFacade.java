/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.ejb;

import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.resourceManagement.persistence.AbstractAssignement;
import com.wegas.resourceManagement.persistence.Activity;
import com.wegas.resourceManagement.persistence.Assignment;
import com.wegas.resourceManagement.persistence.Occupation;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.resourceManagement.persistence.WRequirement;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class ResourceFacade {

    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public ResourceFacade() {
    }
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
     * @param resourceInstance
     * @param taskInstance
     */
    public Assignment assign(ResourceInstance resourceInstance, TaskDescriptor taskDescriptor) {
        resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstance.getId());
        return resourceInstance.assign(taskDescriptor);
    }

    /**
     *
     * @param p
     * @param resourceDescriptorId
     * @param taskDescriptorId
     */
    public Assignment assign(Long resourceInstanceId, Long taskDescriptorId) {
        return this.assign((ResourceInstance) variableInstanceFacade.find(resourceInstanceId), (TaskDescriptor) variableDescriptorFacade.find(taskDescriptorId));
    }

    /**
     *
     * @param resourceInstance
     * @param taskInstance
     */
    public Activity createActivity(ResourceInstance resourceInstance, TaskDescriptor taskDescriptor) {
        resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstance.getId());
        return resourceInstance.createActivity(taskDescriptor);
    }

    /**
     *
     * @param resourceInstance
     * @param taskInstance
     */
    public Activity createActivity(Long resourceInstanceId, Long taskDescriptorId) {
        return this.createActivity((ResourceInstance) variableInstanceFacade.find(resourceInstanceId),
                (TaskDescriptor) variableDescriptorFacade.find(taskDescriptorId));
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
     */
    public Occupation addOccupation(ResourceInstance resourceInstance) {
        resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstance.getId());
        Occupation occupation = resourceInstance.addOccupation();
        return occupation;
    }
     /**
     *
     * @param resourceInstance
     * @param taskInstance
     */
    public Occupation addOccupation(Long resourceInstanceId) {
        ResourceInstance resourceInstance = (ResourceInstance) variableInstanceFacade.find(resourceInstanceId);
        return resourceInstance.addOccupation();
    }

    /**
     *
     * @param assignementId
     * @param index
     */
    public ResourceInstance moveAssignment(final Long assignementId, final int index) {
        final Assignment assignement = this.em.find(Assignment.class, assignementId);
        assignement.getResourceInstance().getAssignments().remove(assignement);
        assignement.getResourceInstance().getAssignments().add(index, assignement);
        return assignement.getResourceInstance();
    }
    
    public ResourceInstance removeAssignment(final Long assignementId) {
        final Assignment assignement = this.em.find(Assignment.class, assignementId);
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
    
    public ResourceInstance addAbstractAssignement(Long resourceInstanceId, AbstractAssignement abstractAssignement) {
        ResourceInstance res = (ResourceInstance)variableInstanceFacade.find(resourceInstanceId);
        if (abstractAssignement instanceof Occupation) {
            Occupation o = (Occupation)abstractAssignement;
            res.addOccupation(o);
        } else if (abstractAssignement instanceof Assignment) {
            Assignment a = (Assignment)abstractAssignement;
            res.addAssignement(a);
        } else {
            Activity a = (Activity)abstractAssignement;
            res.addActivity(a);
        }
        return res;
    }
    
    public void removeAbstractAssignement(Long abstractAssignementId, String type) {
        switch (type) {
            case "occupations":
                Occupation o = this.findOccupation(abstractAssignementId);
                em.remove(o);
                break;
            case "assignment":
                Assignment a = this.findAssignment(abstractAssignementId);
                em.remove(a);
                break;
            default:
                Activity ac = this.findActivity(abstractAssignementId);
                em.remove(ac);
        }
    }
    
    public Occupation findOccupation(Long id){
        return em.find(Occupation.class, id);
    }
    
    public Activity findActivity(Long id) {
        return em.find(Activity.class, id);
    }
    
    public Assignment findAssignment(Long id){
        return em.find(Assignment.class, id);
    }
    
    public TaskInstance findTaskInstance(Long id){
        return em.find(TaskInstance.class, id);
    }
    
    public TaskInstance addTaskPlannification(Long taskInstanceId, Integer periode) {
        TaskInstance ti = findTaskInstance(taskInstanceId);
        ti.getPlannification().add(periode);
        return ti;
    }
    
    public TaskInstance removePlannification(Long taskInstanceId, Integer periode) {
        TaskInstance ti = findTaskInstance(taskInstanceId);
        ti.getPlannification().remove(periode);
        return ti;
    }
}
