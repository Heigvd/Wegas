/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.persistence.User;
import javax.ejb.EJBException;
import org.junit.Test;

/**
 *
 * @author maxence
 */
public class SecurityFacadeTest extends AbstractEJBTest {

    @Test(expected = EJBException.class)
    public void testPrivilegeEscalation_autoGrantAdmin() throws WegasNoResultException {
        User guestLogin = guestLogin();
        userFacade.addRole(guestLogin.getId(), roleFacade.findByName("Administrator").getId());
        gameModelFacade.findAll();
    }

    @Test(expected = EJBException.class)
    public void testPrivilegeEscalation_autoGrantTrainer() throws WegasNoResultException, Throwable {
        User guestLogin = guestLogin();
        userFacade.addRole(guestLogin.getId(), roleFacade.findByName("Trainer").getId());
    }

}
