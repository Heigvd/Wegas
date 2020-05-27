/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
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
import com.wegas.core.security.util.HashMethod;
import com.wegas.core.security.util.JpaAuthentication;
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
        //String oldToken = acc.getShadow().getToken();
        accountFacade.requestPasswordReset(EMAIL, null);
        acc = accountFacade.findJpaByEmail(EMAIL);
        //Assert.assertFalse(oldToken.equals(acc.getShadow().getToken()));
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

    @Test(expected = WegasConflictException.class)
    public void testDuplicateUsername() {
        // first sign up is fine
        this.signup("user_1234@local");

        // second with same address is not
        this.signup("user_1234@local");
    }

    @Test
    public void testIdleGuestRemoval() {
        int nbUser = userFacade.findAll().size();

        logout();

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

    private void assertAuthMethodMatch(JpaAuthentication expected, JpaAuthentication actual) {
        Assert.assertEquals("Mandatory methods do not match", expected.getMandatoryMethod(), actual.getMandatoryMethod());
        Assert.assertEquals("Optional methods do not match", expected.getOptionalMethod(), actual.getOptionalMethod());
    }

    @Test
    public void testHashMethodMigration() {
        WegasUser user = this.signup("userHashTest@test", "myPasswordIsSecure");

        login(admin);

        // assert new account use the default authentication method
        JpaAccount account = ((JpaAccount) user.getUser().getMainAccount());
        assertAuthMethodMatch(userFacade.getDefaultAuthMethod(), (JpaAuthentication) account.getAuthenticationMethod());

        String previousHash = account.getShadow().getPasswordHex();
        String previousSalt = account.getShadow().getSalt();

        login(user);

        login(admin);

        // migrate to new method
        accountFacade.setNextAuth(account.getId(), HashMethod.SHA_256);
        // do the change by authenticating the user
        login(user);

        // check hash has been updated
        login(admin);

        account = (JpaAccount) accountFacade.find(account.getId());
        String newHash = account.getShadow().getPasswordHex();
        String newSalt = account.getShadow().getSalt();

        Assert.assertNotEquals("Hash has not been updated", previousHash, newHash);
        Assert.assertNotEquals("Salt has not been updated", previousSalt, newSalt);

        logout();

        login(u);

        login(admin);

        // migrate to new method
        previousHash = newHash;
        previousSalt = newSalt;
        accountFacade.setNextAuth(account.getId(), HashMethod.SHA_256);
        // do the change by authenticating the user
        login(user);

        // check hash has been updated
        login(admin);

        account = (JpaAccount) accountFacade.find(account.getId());
        newHash = account.getShadow().getPasswordHex();
        newSalt = account.getShadow().getSalt();

        Assert.assertNotEquals("Hash has not been updated", previousHash, newHash);
        Assert.assertNotEquals("Salt has not been updated", previousSalt, newSalt);

        // well, client to server hash method works fine, let's change internal hash method
        accountFacade.setNextShadowHashMethod(account.getId(),
            HashMethod.SHA_512);
        login(user);

        // check hash has been updated
        login(admin);

        account = (JpaAccount) accountFacade.find(account.getId());
        newHash = account.getShadow().getPasswordHex();
        newSalt = account.getShadow().getSalt();

        Assert.assertNotEquals("Hash has not been updated", previousHash, newHash);
        Assert.assertNotEquals("Salt has not been updated", previousSalt, newSalt);

        login(user);

    }

    @Test(expected = WegasErrorMessage.class)
    public void testWrongPassword() {
        WegasUser dumb = this.signup("dumb@local", "abce123");
        dumb.getPassword();
        WegasUser dumber = new WegasUser(dumb.getUser(), "dumb@local", "123abcde");
        this.login(dumber);
    }
}
