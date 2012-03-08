/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.ejb;

import com.wegas.core.persistence.users.UserEntity;
import com.wegas.core.persistence.users.UserEntity_;
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
 * @author fx
 */
@Stateless
public class UserEntityFacade extends AbstractFacade<UserEntity> {

    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    public UserEntityFacade() {
        super(UserEntity.class);
    }

    public UserEntity getUserByPrincipal(String principal) throws NoResultException{
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<UserEntity> user = cq.from(UserEntity.class);
        cq.where(cb.equal(user.get(UserEntity_.name), principal));
        Query q = em.createQuery(cq);
        return (UserEntity) q.getSingleResult();
    }
}
