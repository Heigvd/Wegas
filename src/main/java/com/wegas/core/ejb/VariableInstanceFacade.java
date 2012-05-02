/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.variable.EntityUpdateEvent;
import com.wegas.core.persistence.variable.scope.AbstractScopeEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableInstanceEntity;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class VariableInstanceFacade extends AbstractFacade<VariableInstanceEntity> {

    @Inject
    Event<EntityUpdateEvent> euEvent;
    /**
     *
     */
    @EJB
    private VariableDescriptorFacade variableDescriptorFacade;
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     * @param gameModelId
     * @param variableDescriptorId
     * @param userId
     * @param variableInstance
     * @return
     */
    public VariableInstanceEntity setVariableInstanceByUserId(Long gameModelId,
            Long variableDescriptorId, Long userId, VariableInstanceEntity variableInstance) {

        VariableDescriptorEntity vd = variableDescriptorFacade.find(variableDescriptorId);
        AbstractScopeEntity s = vd.getScope();

        s.setVariableInstance(userId, variableInstance);
        //  VariableInstanceEntity = vd
        VariableInstanceEntity vi = this.find(variableInstance.getId());
        if (vi == null) {
            s.setVariableInstance(userId, variableInstance);
        }
        /*
         * FIXME Does it hurt to create a new entity even although there was
         * already one existing entity
         */
        this.create(variableInstance);
        return variableInstance;
    }

    @Override
    public VariableInstanceEntity update(final Long entityId, final VariableInstanceEntity entity) {
        boolean changedEntity = true;
        VariableInstanceEntity oldEntity = this.find(entityId);
        //TODO : test equality, really
        if (oldEntity.equals(entity)) {
            changedEntity = false;
        }
        oldEntity.merge(entity);
        if (oldEntity instanceof VariableInstanceEntity) {
            euEvent.fire(new EntityUpdateEvent(oldEntity));
        }
        return oldEntity;
    }

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    /**
     *
     */
    public VariableInstanceFacade() {
        super(VariableInstanceEntity.class);
    }
}
