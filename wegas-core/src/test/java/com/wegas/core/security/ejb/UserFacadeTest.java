package com.wegas.core.security.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.TestHelper;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.util.Calendar;
import java.util.List;
import javax.ejb.EJBException;
import javax.ejb.embeddable.EJBContainer;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @author Yannick Lagger
 */
public class UserFacadeTest {

    private static final Logger logger = LoggerFactory.getLogger(UserFacadeTest.class);

    private static GameModelFacade gameModelFacade;

    private static GameFacade gameFacade;

    private static UserFacade userFacade;

    private static RoleFacade roleFacade;

    private static AccountFacade accountFacade;

    private static AbstractAccount abstractAccount;

    private static User u;

    private static EJBContainer container;

    @BeforeClass
    public static void setUpClass() throws Exception {
        container = TestHelper.getEJBContainer();
        userFacade = Helper.lookupBy(container.getContext(), UserFacade.class);
        roleFacade = Helper.lookupBy(container.getContext(), RoleFacade.class);
        accountFacade = Helper.lookupBy(container.getContext(), AccountFacade.class);

        gameModelFacade = GameModelFacade.lookup();

        gameFacade = GameFacade.lookup();

        u = userFacade.guestLogin();
        abstractAccount = u.getMainAccount();
        RequestFacade.lookup().getRequestManager().setCurrentUser(u);
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        userFacade.remove(u.getId());
        TestHelper.closeContainer();
    }

    /*private GameModel gameModel;
    private Game game;
     */
    @Before
    public void setUp() {
        /*
        gameModel = new GameModel();
        gameModelFacade.create(gameModel);

        game = new Game();
        game.setName("aGame");
        game.setToken("aGameToken");
        game.setAccess(Game.GameAccess.OPEN);

        gameFacade.create(gameModel.getId(), game);
         */
    }

    /**
     * Test of find method, of class UserFacade.
     */
    @Test
    public void testFind() {

        // findAll()
        List<User> users = userFacade.findAll();
        Assert.assertEquals(u, users.get(0));

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

        u.removePermission(new Permission(PERM));
        u.removePermission(new Permission(PERM2));
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
        userFacade.guestLogin();                                                // Log in as guest

        Assert.assertEquals(2, userFacade.findAll().size());                    // Assert creation

        User user = userFacade.getCurrentUser();                                // Set created time to 3 month ago
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.MONTH, calendar.get(Calendar.MONTH) - 13);
        AbstractAccount account = user.getMainAccount();
        account.setCreatedTime(calendar.getTime());
        accountFacade.merge(account);

        userFacade.removeIdleGuests();                                          // Run idle guest account removal

        Assert.assertEquals(1, userFacade.findAll().size());                    // Assert removal succes
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
