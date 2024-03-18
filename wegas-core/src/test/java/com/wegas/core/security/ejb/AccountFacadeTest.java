/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2023 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.ejb;

import com.wegas.core.ejb.cron.EjbTimerFacade;
import com.wegas.core.rest.util.pagination.Page;
import com.wegas.core.rest.util.pagination.Pageable;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.test.arquillian.AbstractArquillianTestMinimal;
import jakarta.inject.Inject;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.List;

public class AccountFacadeTest extends AbstractArquillianTestMinimal {

    private static final Logger logger = LoggerFactory.getLogger(UserFacadeTest.class);

    private JpaAccount abstractAccount;

    private WegasUser u;

    private Role role1;

    private Role role2;

    private static final String ROLE_1 = "Role_1";

    private static final String ROLE_2 = "Role_2";

    private static final String EMAIL = "accountfacadetest@local";

    @Inject
    private EjbTimerFacade ejbTimerFacade;

    @Inject
    SecurityTestFacade securityTestFacade;

    @Before
    public void setUp() throws Exception {
        login(admin);
        role1 = new Role(ROLE_1);
        roleFacade.create(role1);

        role2 = new Role(ROLE_2);
        roleFacade.create(role2);

        u = this.signup(EMAIL);
        login(u);
        abstractAccount = (JpaAccount) u.getUser().getMainAccount();

        login(admin);
        addRoles(u, role1, role2);
        requestManager.clearEntities();
    }

    @Test
    public void testFindAllRegisteredUsersPaginated() {
        Page<User> paginatedUsers = accountFacade.findAllRegisteredUsersPaginated(new Pageable(1, 10, ""));
        Assert.assertEquals(paginatedUsers.getTotal(), 2L);
        Assert.assertTrue(paginatedUsers.getPageContent().contains(u.getUser()));
        Assert.assertTrue(paginatedUsers.getPageContent().contains(admin.getUser()));
    }

    @Test
    public void testFindAllRegisteredUsersPaginatedFiltered() {
        abstractAccount.setFirstname("aaa");
        abstractAccount.setLastname("bbb");
        accountFacade.update(abstractAccount.getId(), abstractAccount);
        Page<User> paginatedUsers = accountFacade.findAllRegisteredUsersPaginated(new Pageable(1, 10, abstractAccount.getFirstname()));

        Assert.assertEquals(paginatedUsers.getTotal(), 1L);
        Assert.assertTrue(paginatedUsers.getPageContent().contains(u.getUser()));
        Assert.assertFalse(paginatedUsers.getPageContent().contains(admin.getUser()));
    }

    @Test
    public void testFindAllRegisteredUsersPaginatedNone() {
        abstractAccount.setFirstname("aaa");
        abstractAccount.setLastname("bbb");
        accountFacade.update(abstractAccount.getId(), abstractAccount);
        Page<User> paginatedUsers = accountFacade.findAllRegisteredUsersPaginated(new Pageable(1, 10, "ccc"));

        Assert.assertEquals(paginatedUsers.getTotal(), 0L);
        Assert.assertFalse(paginatedUsers.getPageContent().contains(u.getUser()));
        Assert.assertFalse(paginatedUsers.getPageContent().contains(admin.getUser()));
    }
}