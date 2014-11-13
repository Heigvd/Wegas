/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.exception.PersistenceException;
import com.wegas.core.security.persistence.Role;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.TypedQuery;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class RoleFacade extends BaseFacade<Role> {

    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;

    /**
     *
     */
    public RoleFacade() {
        super(Role.class);
    }

    /**
     *
     * @param name
     * @return
     * @throws PersistenceException
     */
    public Role findByName(String name) throws PersistenceException {
        /*
        CriteriaBuilder cb = em.getCriteriaBuilder();
        CriteriaQuery cq = cb.createQuery();
        Root<Role> role = cq.from(Role.class);
        cq.where(cb.equal(role.get(Role_.name), name));
        Query q = em.createQuery(cq);
        return (Role) q.getSingleResult();
        */

        final TypedQuery<Role> query = getEntityManager().createNamedQuery("Role.findByName", Role.class);
        query.setParameter("name", name);
        return query.getSingleResult();
    }

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }
}
