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
import com.wegas.core.security.persistence.User;
import java.util.List;
import java.util.Set;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.NoResultException;
import javax.persistence.TypedQuery;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class RoleFacade extends BaseFacade<Role> {

    private static Logger logger = LoggerFactory.getLogger(RoleFacade.class);

    /**
     *
     */
    public RoleFacade() {
        super(Role.class);
    }

    @Override
    public void create(Role entity) {
        getEntityManager().persist(entity);
    }

    @Override
    public void remove(Role role) {
        // Strike out all members from the role to avoid pkey violation
        Set<User> users = role.getUsers();

        for (User u : users) {
            u.removeRole(role);
        }
        getEntityManager().remove(role);
    }

    /**
     *
     * @param name
     * @return role matching the given name
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
