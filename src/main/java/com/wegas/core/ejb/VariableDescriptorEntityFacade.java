/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2011
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.variabledescriptor.VariableDescriptorEntity;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class VariableDescriptorEntityFacade extends AbstractFacade<VariableDescriptorEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    @EJB
    private GameModelEntityFacade gameModelEntityFacade;

    /**
     *
     * @param gameModelId
     * @param variableDescriptorEntity
     */
    public void create(Long gameModelId, VariableDescriptorEntity variableDescriptorEntity) {
        this.gameModelEntityFacade.find(gameModelId).addVariableDescriptor(variableDescriptorEntity);
        this.create(variableDescriptorEntity);
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
    public VariableDescriptorEntityFacade() {
        super(VariableDescriptorEntity.class);
    }
}
