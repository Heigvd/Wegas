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

import com.wegas.core.persistence.game.GameModelEntity;
import com.wegas.core.persistence.user.UserEntity;
import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
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
@LocalBean
public class VariableDescriptorFacade extends AbstractFacadeImpl<VariableDescriptorEntity> {

    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private GameModelFacade gameModelFacade;

    /**
     *
     * @param gameModelId
     * @param variableDescriptorEntity
     */
    public void create(Long gameModelId, VariableDescriptorEntity variableDescriptorEntity) {
        this.gameModelFacade.find(gameModelId).addVariableDescriptor(variableDescriptorEntity);
        //super.create(variableDescriptorEntity);
    }

    /**
     *
     * @param name
     * @return
     */
    public VariableDescriptorEntity findByName(GameModelEntity gameModel, String name) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<UserEntity> variableDescriptor = cq.from(VariableDescriptorEntity.class);
        //cq.where(cb.equal(variableDescriptor.get(VariableDescriptorEntity_.name), name));
        cq.where(cb.equal(variableDescriptor.get("name"), name));
        //cq.where(cb.equal(variableDescriptor.get(VariableDescriptorEntity_.gameModel), gameModel));
        cq.where(cb.equal(variableDescriptor.get("gameModel"), gameModel));
        Query q = em.createQuery(cq);
        return (VariableDescriptorEntity) q.getSingleResult();
    }

    /**
     *
     * @param gameModelId
     * @return
     */
    public List<VariableDescriptorEntity> findByGameModelId(Long gameModelId) {
        Query findByRootGameModelId = em.createNamedQuery("findVariableDescriptorsByRootGameModelId");
        findByRootGameModelId.setParameter("gameModelId", gameModelId);
        return findByRootGameModelId.getResultList();
    }

    /**
     *
     * @param variableDescriptorClass the filtering class
     * @param gameModelId The Game Model ID
     * @return All specified classes and subclasses belonging to the game model.
     */
    public List<VariableDescriptorEntity> findByClass(GameModelEntity gamemodel, Class variableDescriptorClass) {

        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<UserEntity> variableDescriptor = cq.from(variableDescriptorClass);
        // cq.where(cb.equal(variableDescriptor.get(VariableDescriptorEntity_.gameModel), gameModelId));
        cq.where(cb.equal(variableDescriptor.get("gameModel"), gamemodel));
        Query q = em.createQuery(cq);
        return q.getResultList();

        //Query findVariableDescriptorsByClass = em.createQuery("SELECT DISTINCT variableDescriptor FROM " + variableDescriptorClass.getSimpleName() + " variableDescriptor LEFT JOIN variableDescriptor.gameModel AS gm WHERE gm.id =" + gameModelId, variableDescriptorClass);
        //return findVariableDescriptorsByClass.getResultList();
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
