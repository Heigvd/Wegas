/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.test.arquillian.AbstractArquillianTest;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.security.guest.GuestToken;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.util.Calendar;
import java.util.List;
import javax.ejb.EJBException;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Yannick Lagger
 */
public class UserFacadeTest extends AbstractArquillianTest {

    private static final Logger logger = LoggerFactory.getLogger(UserFacadeTest.class);

    private AbstractAccount abstractAccount;

    private User u;

    @Before
    public void setUp() {
        u = userFacade.guestLogin();
        abstractAccount = u.getMainAccount();

        Subject subject = SecurityUtils.getSubject();
        subject.login(new GuestToken(u.getMainAccount().getId()));
    }

    /**
     * Test of find method, of class UserFacade.
     */
    @Test
    public void testFind() {

        // findAll()
        List<User> users = userFacade.findAll();

        Assert.assertTrue(users.contains(u));

        // find
        Assert.assertEquals(u, userFacade.find(u.getId()));
    }

    @Test
    public void testAccountUpdate() {
        final String PERM = "GameModel:*:*";
        final String PERM2 = "Game2:*:*";

        userFacade.addUserPermission(u, PERM);
        accountFacade.update(abstractAccount.getId(), abstractAccount);
        AbstractAccount a = accountFacade.find(abstractAccount.getId());
        Assert.assertEquals(PERM, u.getPermissions().get(0).getValue());

        userFacade.addUserPermission(u, PERM2);
        accountFacade.update(abstractAccount.getId(), a);
        a = accountFacade.find(abstractAccount.getId());
        Assert.assertEquals(PERM2, u.getPermissions().get(1).getValue());

        u.removePermission(PERM);
        u.removePermission(PERM2);
        accountFacade.update(a.getId(), a);
        a = accountFacade.find(abstractAccount.getId());
        Assert.assertTrue(a.getPermissions().isEmpty());
    }

    @Test
    public void testRoleUpdate() throws Exception {
        Role role = new Role("JustARole");
        roleFacade.create(role);

        final String PERM = "Game:*:*";

        role.addPermission(PERM);
        roleFacade.update(role.getId(), role);
        Role r = roleFacade.find(role.getId());
        Assert.assertEquals(PERM, r.getPermissions().get(0).getValue());

        r.removePermission(PERM);
        roleFacade.update(r.getId(), r);
        r = roleFacade.find(r.getId());
        Assert.assertTrue(r.getPermissions().isEmpty());
    }

    /**
     *
     */
    @Test
    public void testSharing() {
        /*
        String gID = "g" + game.getId();
        String gmID = "gm" + gameModel.getId();

        List<User> findEditors = userFacade.findEditors(gID);

        userFacade.addUserPermission(u.getId(), "Game:Edit:" + gID);
        userFacade.addUserPermission(u.getId(), "GameModel:Edit:" + gmID);

        userFacade.removeScenarist(gameModel.getId(), u);
        userFacade.removeTrainer(game.getId(), u);
         */
    }

    /**
     * Test SendNewPassword
     */
    //@Test
    public void testSendNewPassword() throws Exception {
        JpaAccount acc = accountFacade.findJpaByEmail("a@a.local");
        String oldPwd = acc.getPasswordHex();
        userFacade.sendNewPassword("a@a.local");
        acc = accountFacade.findJpaByEmail("a@a.local");
        Assert.assertFalse(oldPwd.equals(acc.getPasswordHex()));
    }

    /**
     * Test CreateSameUser
     */
    @Test(expected = EJBException.class)
    public void testCreateSameUser() throws WegasErrorMessage {
        u.addAccount(abstractAccount);
        userFacade.create(u);
    }

    @Test
    public void testIdleGuestRemoval() {
        int nbUser = userFacade.findAll().size();
        userFacade.guestLogin();                                                // Log in as guest

        Assert.assertEquals(nbUser + 1, userFacade.findAll().size());                    // Assert creation

        User user = userFacade.getCurrentUser();                                // Set created time to 3 month ago
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.MONTH, calendar.get(Calendar.MONTH) - 13);
        AbstractAccount account = user.getMainAccount();
        account.setCreatedTime(calendar.getTime());
        accountFacade.merge(account);

        userFacade.removeIdleGuests();                                          // Run idle guest account removal

        Assert.assertEquals(nbUser, userFacade.findAll().size());                    // Assert removal succes
    }

    @Test
    public void testRemoveRole() {

        Role r = new Role("Test");
        roleFacade.create(r);
        //r = roleFacade.find(r.getId());

        Assert.assertEquals("Test", roleFacade.find(r.getId()).getName());

        userFacade.addRole(u.getId(), r.getId());

        //roleFacade.merge(r);
        //accountFacade.merge(abstractAccount);
        Assert.assertEquals(1, accountFacade.find(abstractAccount.getId()).getRoles().size());
        Assert.assertEquals(1, roleFacade.find(r.getId()).getNumberOfMember());
        roleFacade.remove(r.getId());

        Assert.assertNull(roleFacade.find(r.getId()));                                             // A not NoResultException should be thrown here
    }
}
