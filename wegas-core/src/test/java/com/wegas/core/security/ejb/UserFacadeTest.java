/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.ejb.cron.EjbTimerFacade;
import com.wegas.core.exception.client.WegasConflictException;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.test.arquillian.AbstractArquillianTestMinimal;
import java.util.Calendar;
import java.util.List;
import javax.ejb.EJBException;
import javax.inject.Inject;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Yannick Lagger
 */
public class UserFacadeTest extends AbstractArquillianTestMinimal {

    private static final Logger logger = LoggerFactory.getLogger(UserFacadeTest.class);

    private JpaAccount abstractAccount;

    private WegasUser u;

    private Role role1;

    private Role role2;

    private static final String ROLE_1 = "Role_1";

    private static final String ROLE_2 = "Role_2";

    private static final String EMAIL = "userfacadetest@local";

    @Inject
    private EjbTimerFacade ejbTimerFacade;

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

    /**
     * Test of find method, of class UserFacade.
     */
    @Test
    public void testFind() {

        // findAll()
        List<User> users = userFacade.findAll();
        Assert.assertTrue(users.contains(u.getUser()));
        Assert.assertTrue(users.contains(admin.getUser()));

        Assert.assertEquals(2l, users.size()); // admin + u

        // find
        Assert.assertEquals(u.getUser(), userFacade.find(u.getId()));
        Assert.assertEquals(admin.getUser(), userFacade.find(admin.getId()));
    }

    @Test
    public void testAccountUpdate() {
        final String PERM = "GameModel:*:*";
        final String PERM2 = "Game2:*:*";

        userFacade.addUserPermission(u.getUser(), PERM);
        accountFacade.update(abstractAccount.getId(), abstractAccount);
        AbstractAccount a = accountFacade.find(abstractAccount.getId());
        Assert.assertEquals(PERM, u.getUser().getPermissions().get(0).getValue());

        userFacade.addUserPermission(u.getUser(), PERM2);
        accountFacade.update(abstractAccount.getId(), a);
        a = accountFacade.find(abstractAccount.getId());
        Assert.assertEquals(PERM2, u.getUser().getPermissions().get(1).getValue());

        u.getUser().removePermission(PERM);
        u.getUser().removePermission(PERM2);
        accountFacade.update(a.getId(), a);
        a = accountFacade.find(abstractAccount.getId());
        Assert.assertTrue(a.getPermissions().isEmpty());
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
        JpaAccount acc = accountFacade.findJpaByEmail(EMAIL);
        String oldToken = acc.getToken();
        userFacade.requestPasswordReset(EMAIL, null);
        acc = accountFacade.findJpaByEmail(EMAIL);
        Assert.assertFalse(oldToken.equals(acc.getToken()));
    }

    /**
     * Test CreateSameUser
     */
    @Test(expected = EJBException.class)
    public void testCreateSameUser() throws WegasErrorMessage {
        u.getUser().addAccount(abstractAccount);
        userFacade.create(u.getUser());
    }

    @Test
    public void testLoginForbidden() {
        System.setProperty("guestallowed", "false");

        try {
            this.guestLogin();
            Assert.fail("Should throw exception !");
        } catch (Exception ex) {
        }

        System.setProperty("guestallowed", "true");
    }

    @Test
    public void testDuplicateUsername() {
        this.signup("user_1234@local");
        try {
            this.signup("user_1234@local");
            Assert.fail("Shoudl throw exception !");
        } catch (WegasConflictException ex) {
        }
    }

    @Test
    public void testIdleGuestRemoval() {
        int nbUser = userFacade.findAll().size();

        userFacade.guestLogin();
        Assert.assertEquals(nbUser + 1, userFacade.findAll().size());

        // Since guests are removed only oif they were create more than three month ago,
        // override this guest createdTime
        User newGuestUser = userFacade.getCurrentUser();
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.MONTH, calendar.get(Calendar.MONTH) - 13);
        AbstractAccount account = newGuestUser.getMainAccount();
        account.setCreatedTime(calendar.getTime());
        accountFacade.merge(account);

        login(admin);
        ejbTimerFacade.removeIdleGuests();

        Assert.assertEquals(nbUser, userFacade.findAll().size());
    }
}
