/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.persistence.Role;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.NoResultException;
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
    public RoleFacade() {
        super(Role.class);
    }

    /**
     *
     * @param name
     * @return
     * @throws WegasNoResultException role not found
     */
    public Role findByName(String name) throws WegasNoResultException {
        try {
            final TypedQuery<Role> query = getEntityManager().createNamedQuery("Role.findByName", Role.class);
            query.setParameter("name", name);
            return query.getSingleResult();
        } catch (NoResultException ex) {
            throw new WegasNoResultException(ex);
        }
    }
}
