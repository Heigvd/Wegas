/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.ejb;

import com.wegas.persistence.users.UserEntity;
import com.wegas.persistence.users.UserEntity_;
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
public class UserEntityFacade extends AbstractFacade<UserEntity> {

    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    /**
     *
     */
    private EntityManager em;

    /**
     * 
     * @param principal
     * @return
     */
    public UserEntity getUserByPrincipal(String principal) {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<UserEntity> user = cq.from(UserEntity.class);
        cq.where(cb.equal(user.get(UserEntity_.name), principal));
        Query q = em.createQuery(cq);

        //try {
        return (UserEntity) q.getSingleResult();
        //} catch (NoResultException e) {
        //    return null;
        //}
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
    public UserEntityFacade() {
        super(UserEntity.class);
    }
}
