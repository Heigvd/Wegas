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

import com.wegas.core.persistence.user.UserEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity_;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.criteria.CriteriaBuilder;
import javax.persistence.criteria.CriteriaQuery;
import javax.persistence.criteria.Root;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
public class VariableDescriptorFacade extends AbstractFacade<VariableDescriptorEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelEntityFacade;

    /**
     *
     * @param gameModelId
     * @param variableDescriptorEntity
     */
    public void create(Long gameModelId, VariableDescriptorEntity variableDescriptorEntity) {
        this.gameModelEntityFacade.find(gameModelId).addVariableDescriptor(variableDescriptorEntity);
        super.create(variableDescriptorEntity);
    }

    /**
     *
     * @param name
     * @return
     */
    public VariableDescriptorEntity findByName(String name) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<UserEntity> variableDescriptor = cq.from(VariableDescriptorEntity.class);
        //cq.where(cb.equal(variableDescriptor.get(VariableDescriptorEntity_.name), name));
        cq.where(cb.equal(variableDescriptor.get("name"), name));
        Query q = em.createQuery(cq);
        return (VariableDescriptorEntity) q.getSingleResult();
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
    public VariableDescriptorFacade() {
        super(VariableDescriptorEntity.class);
    }
}
