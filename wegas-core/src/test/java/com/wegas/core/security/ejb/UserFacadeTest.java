package com.wegas.core.security.ejb;

import com.wegas.core.ejb.AbstractEJBTestBase;
import com.wegas.core.ejb.TestHelper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.util.Calendar;
import java.util.List;
import javax.ejb.EJBException;
import org.junit.Assert;
import org.junit.Before;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Yannick Lagger
 */
public class UserFacadeTest extends AbstractEJBTestBase {

    private static final Logger logger = LoggerFactory.getLogger(UserFacadeTest.class);

    private static JpaAccount abstractAccount;

    private static WegasUser u;

    private static Role role1;

    private static Role role2;

    private static final String ROLE_1 = "Role_1";

    private static final String ROLE_2 = "Role_2";

    private static final String EMAIL = "userfacadetest@local";

    @Before
    public void setUp() throws Exception {
        login(admin);
        role1 = new Role(ROLE_1);
        roleFacade.create(role1);

        role2 = new Role(ROLE_2);
        roleFacade.create(role2);

        u = AbstractEJBTestBase.signup(EMAIL);
        login(u);
        abstractAccount = (JpaAccount) u.getUser().getMainAccount();

        login(admin);
        addRoles(u, role1, role2);
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

        Assert.assertEquals(2l, users.size());

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

        u.getUser().removePermission(new Permission(PERM));
        u.getUser().removePermission(new Permission(PERM2));
        accountFacade.update(a.getId(), a);
        a = accountFacade.find(abstractAccount.getId());
        Assert.assertTrue(a.getPermissions().isEmpty());
    }

    @Test
    public void testRoleUpdate() throws Exception {
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
        String oldPwd = acc.getPasswordHex();
        userFacade.sendNewPassword(EMAIL);
        acc = accountFacade.findJpaByEmail(EMAIL);
        Assert.assertFalse(oldPwd.equals(acc.getPasswordHex()));
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
    public void testIdleGuestRemoval() {
        userFacade.guestLogin();                                                // Log in as guest

        Assert.assertEquals(3, userFacade.findAll().size()); // Admin, u and currentGuest

        User user = userFacade.getCurrentUser();                                // Set created time to 3 month ago
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.MONTH, calendar.get(Calendar.MONTH) - 13);
        AbstractAccount account = user.getMainAccount();
        account.setCreatedTime(calendar.getTime());
        accountFacade.merge(account);

        userFacade.removeIdleGuests();                                          // Run idle guest account removal

        Assert.assertEquals(2, userFacade.findAll().size());                    // Assert removal succes
    }

    @Test
    public void testRemoveRole() {

        int numRole = userFacade.find(u.getId()).getRoles().size();

        Role r = new Role("Test");
        roleFacade.create(r);
        //r = roleFacade.find(r.getId());

        Assert.assertEquals("Test", roleFacade.find(r.getId()).getName());

        addRoles(u, r);

        //roleFacade.merge(r);
        //accountFacade.merge(abstractAccount);
        Assert.assertEquals(numRole + 1, userFacade.find(u.getId()).getRoles().size());
        Assert.assertEquals(1, roleFacade.find(r.getId()).getNumberOfMember());

        roleFacade.remove(r.getId());

        Assert.assertNull(roleFacade.find(r.getId()));                                             // A not NoResultException should be thrown here
    }
}
