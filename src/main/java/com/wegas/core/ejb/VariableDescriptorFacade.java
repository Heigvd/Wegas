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

import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.user.User;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableDescriptor_;
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
public class VariableDescriptorFacade extends AbstractFacadeImpl<VariableDescriptor> {

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
     * @param variableDescriptor
     */
    public void create(Long gameModelId, VariableDescriptor variableDescriptor) {
        this.gameModelFacade.find(gameModelId).addVariableDescriptor(variableDescriptor);
        //super.create(variableDescriptor);
    }

    /**
     *
     * @param gameModel
     * @param name
     * @return
     */
    public VariableDescriptor findByName(GameModel gameModel, String name) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<User> variableDescriptor = cq.from(VariableDescriptor.class);
//        cq.where(cb.and(
//                cb.equal(variableDescriptor.get(VariableDescriptor_.gameModel), gameModel),
//                cb.equal(variableDescriptor.get(VariableDescriptor_.name), name)));
        cq.where(cb.and(
                cb.equal(variableDescriptor.get("gameModel"), gameModel),
                cb.equal(variableDescriptor.get("name"), name)));
        Query q = em.createQuery(cq);
        return (VariableDescriptor) q.getSingleResult();
    }

    /**
     *
     * @param gameModelId
     * @return
     */
    public List<VariableDescriptor> findByGameModelId(Long gameModelId) {
        Query findByRootGameModelId = em.createNamedQuery("findVariableDescriptorsByRootGameModelId");
        findByRootGameModelId.setParameter("gameModelId", gameModelId);
        return findByRootGameModelId.getResultList();
    }

    /**
     *
     * @param gamemodel
     * @param variableDescriptorClass the filtering class
     * @return All specified classes and subclasses belonging to the game model.
     */
    public List<VariableDescriptor> findByClass(GameModel gamemodel, Class variableDescriptorClass) {

        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<User> variableDescriptor = cq.from(variableDescriptorClass);
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
        super(VariableDescriptor.class);
    }
}
