/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.ejb;

import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.AbstractAccount_;
import javax.ejb.LocalBean;
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
@LocalBean
public class AccountFacade extends AbstractFacadeImpl<AbstractAccount> {

    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public AccountFacade() {
        super(AbstractAccount.class);
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
     * Return a user based on his principal.
     *
     * @todo Currently only lookup in the jdbcrealm
     *
     * @param principal
     * @return
     * @throws NoResultException
     */
    public AbstractAccount findByUsername(String username) throws NoResultException {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<AbstractAccount> account = cq.from(AbstractAccount.class);
        cq.where(cb.equal(account.get(AbstractAccount_.username), username));
        Query q = em.createQuery(cq);
        return (AbstractAccount) q.getSingleResult();
    }

    public AbstractAccount findByEmail(String email) throws NoResultException {
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<AbstractAccount> account = cq.from(AbstractAccount.class);
        cq.where(cb.equal(account.get(AbstractAccount_.email), email));
        Query q = em.createQuery(cq);
        return (AbstractAccount) q.getSingleResult();
    }
}
