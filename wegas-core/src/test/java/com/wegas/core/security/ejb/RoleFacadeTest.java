/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.persistence.Role;
import com.wegas.test.arquillian.AbstractArquillianTest;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;

/**
 *
 * @author maxence
 */
public class RoleFacadeTest extends AbstractArquillianTest {

    private Role role1;
    private Role role2;

    private static final String ROLE_1 = "Role_1";
    private static final String ROLE_2 = "Role_2";

    @Before
    public void setUp() throws Exception {
        login(admin);
        role1 = new Role(ROLE_1);
        roleFacade.create(role1);

        role2 = new Role(ROLE_2);
        roleFacade.create(role2);

        login(admin);
        requestManager.clearEntities();
    }

    @Test
    public void testFindRole() throws WegasNoResultException {
        Assert.assertEquals(role1, roleFacade.findByName(ROLE_1));

        try {
            roleFacade.findByName("NotA Role");
            Assert.fail("Should throw exception !");
        } catch (WegasNoResultException ex) {
        }

    }

    @Test
    public void testRemoveRole() {

        int numRole = userFacade.find(admin.getId()).getRoles().size();

        Role r = new Role("Test");
        roleFacade.create(r);
        //r = roleFacade.find(r.getId());

        Assert.assertEquals("Test", roleFacade.find(r.getId()).getName());

        addRoles(admin, r);

        Assert.assertEquals(numRole + 1, userFacade.find(admin.getId()).getRoles().size());
        Assert.assertEquals(1, roleFacade.find(r.getId()).getNumberOfMember());

        roleFacade.remove(r.getId());

        Assert.assertNull(roleFacade.find(r.getId()));                                             // A not NoResultException should be thrown here
    }

    @Test(expected = Exception.class)
    public void testRoleUpdate_forbidden() throws Exception {
        login(user);
        final String PERM = "Game:*:*";

        role2.addPermission(PERM);
        roleFacade.update(role2.getId(), role2);
        Role r = roleFacade.find(role2.getId());
        Assert.assertEquals(PERM, r.getPermissions().get(0).getValue());

        r.removePermission(PERM);
        roleFacade.update(r.getId(), r);
        r = roleFacade.find(r.getId());
        Assert.assertTrue(r.getPermissions().isEmpty());
    }

    @Test
    public void testRoleUpdate() throws Exception {
        login(admin);
        final String PERM = "Game:*:*";

        role2.addPermission(PERM);
        roleFacade.update(role2.getId(), role2);
        Role r = roleFacade.find(role2.getId());
        Assert.assertEquals(PERM, r.getPermissions().get(0).getValue());

        r.removePermission(PERM);
        roleFacade.update(r.getId(), r);
        r = roleFacade.find(r.getId());
        Assert.assertTrue(r.getPermissions().isEmpty());
    }

}
