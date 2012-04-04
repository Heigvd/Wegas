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

import com.wegas.core.persistence.user.UserEntity;
import com.wegas.core.persistence.user.UserEntity_;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.NoResultException;
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
public class UserEntityFacade extends AbstractFacade<UserEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

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
    public UserEntityFacade() {
        super(UserEntity.class);
    }

    /**
     *
     * @param principal
     * @return
     * @throws NoResultException
     */
    public UserEntity getUserByPrincipal(String principal) throws NoResultException{
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<UserEntity> user = cq.from(UserEntity.class);
        cq.where(cb.equal(user.get(UserEntity_.name), principal));
        Query q = em.createQuery(cq);
        return (UserEntity) q.getSingleResult();
    }
}
