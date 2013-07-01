package com.wegas.core.security.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.TestHelper;
import com.wegas.core.exception.WegasException;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.util.List;
import java.util.Map;
import javax.ejb.embeddable.EJBContainer;
import org.junit.AfterClass;
import org.junit.Assert;
import org.junit.BeforeClass;
import org.junit.Test;

/**
 *
 * @author Yannick Lagger
 */
public class UserFacadeTest {

    private static UserFacade userFacade;
    private static RoleFacade roleFacade;
    private static AccountFacade accountFacade;
    private static JpaAccount abstractAccount;
    private static User u;
    private static Role roleP;
    private static Role roleR;
    private static EJBContainer container;

    @BeforeClass
    public static void setUpClass() throws Exception {
        container = TestHelper.getEJBContainer();
        userFacade = Helper.lookupBy(container.getContext(), UserFacade.class);
        roleFacade = Helper.lookupBy(container.getContext(), RoleFacade.class);
        accountFacade = Helper.lookupBy(container.getContext(), AccountFacade.class);
        abstractAccount = new JpaAccount();
        abstractAccount.setEmail("a@a.com");
        roleP = new Role("Public");
        roleFacade.create(roleP);
        roleR = new Role("Registered");
        roleFacade.create(roleR);
        abstractAccount.addRole(roleP);
        abstractAccount.addRole(roleR);
        u = new User();
        u.addAccount(abstractAccount);
        userFacade.create(u);
    }

    @AfterClass
    public static void tearDownClass() throws Exception {
        userFacade.remove(u.getId());
        roleFacade.remove(roleP.getId());
        roleFacade.remove(roleR.getId());
        container.close();
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
        final String PERM = "Game:*:*";
        final String PERM2 = "Game2:*:*";

        abstractAccount.addPermission(PERM);
        accountFacade.update(abstractAccount.getId(), abstractAccount);
        AbstractAccount a = accountFacade.find(abstractAccount.getId());
        Assert.assertEquals(PERM, a.getPermissions().get(0).getValue());

        a.addPermission(PERM2);
        accountFacade.update(abstractAccount.getId(), a);
        a = accountFacade.find(abstractAccount.getId());
        Assert.assertEquals(PERM2, a.getPermissions().get(1).getValue());

        a.removePermission(PERM2);
        a.removePermission(PERM);
        accountFacade.update(a.getId(), a);
        a = accountFacade.find(abstractAccount.getId());
        Assert.assertTrue(a.getPermissions().isEmpty());
    }

    @Test
    public void testRoleUpdate() throws Exception {
        final String PERM = "Game:*:*";

        roleP.addPermission(PERM);
        roleFacade.update(roleP.getId(), roleP);
        Role r = roleFacade.find(roleP.getId());
        Assert.assertEquals(PERM, r.getPermissions().get(0).getValue());

        r.removePermission(PERM);
        roleFacade.update(r.getId(), r);
        r = roleFacade.find(r.getId());
        Assert.assertTrue(r.getPermissions().isEmpty());
    }

    /**
     * Test of add and get permissions
     */
    @Test
    public void testAddAndGetPermissions() throws Exception {
        // Add permissions
        userFacade.addRolePermission(roleP.getId(), "GameModel:Edit:gm1");
        userFacade.addRolePermission(roleP.getId(), "GameModel:View:gm1");
        Assert.assertFalse(userFacade.addRolePermission(roleP.getId(), "GameModel:View:gm1"));

        // Get all GameModel permissions by GameModel id or Game permissions by Game id
        List<Map> rolePermissions = userFacade.findRolePermissionByInstance("gm1");
        Assert.assertEquals("Public", rolePermissions.get(0).get("name"));
        Assert.assertEquals("[GameModel:Edit:gm1, GameModel:View:gm1]", rolePermissions.get(0).get("permissions").toString());

        userFacade.deleteRolePermissionsByIdAndInstance(roleP.getId(), "gm1");
    }

    /**
     * Test testDeletePermissionByInstance
     */
    @Test
    public void testDeleteRolePermission() throws Exception {
        // Add permissions
        userFacade.addRolePermission(roleP.getId(), "GameModel:Edit:gm1");
        userFacade.addRolePermission(roleP.getId(), "GameModel:View:gm1");

        userFacade.deleteRolePermission(roleP.getId(), "GameModel:View:gm1");
        List<Map> rolePermissions = userFacade.findRolePermissionByInstance("gm1");
        Assert.assertEquals("[GameModel:Edit:gm1]", rolePermissions.get(0).get("permissions").toString());

        userFacade.deleteRolePermission(roleP.getId(), "GameModel:Edit:gm1");
        rolePermissions = userFacade.findRolePermissionByInstance("gm1");
        Assert.assertEquals("[]", rolePermissions.toString());
    }

    /**
     * Test deleteAllRolePermissions
     */
    @Test
    public void testDeleteRolePermissionsByIdAndInstance() throws Exception {
        userFacade.addRolePermission(roleR.getId(), "GameModel:Edit:gm20");
        userFacade.addRolePermission(roleR.getId(), "GameModel:View:gm20");
        userFacade.addRolePermission(roleR.getId(), "GameModel:Token:gm20");

        // Delete all permission from a role in a Game or GameModel
        List<Map> rolePermissions = userFacade.findRolePermissionByInstance("gm20");
        Assert.assertEquals("[GameModel:Edit:gm20, GameModel:View:gm20, GameModel:Token:gm20]", rolePermissions.get(0).get("permissions").toString());
        userFacade.deleteRolePermissionsByIdAndInstance(roleR.getId(), "gm20");
        Role r = roleFacade.findByName("Registered");
        Assert.assertEquals(0, r.getPermissions().size());
    }

    /**
     * Test DeleteAllRolePermissionsById
     */
    @Test
    public void testDeleteRolePermissionsByInstance() throws Exception {
        userFacade.addRolePermission(roleR.getId(), "GameModel:Edit:gm20");
        userFacade.addRolePermission(roleR.getId(), "GameModel:View:gm20");
        userFacade.addRolePermission(roleR.getId(), "GameModel:Token:gm20");

        userFacade.addRolePermission(roleP.getId(), "GameModel:Edit:gm20");
        userFacade.addRolePermission(roleP.getId(), "GameModel:View:gm20");
        userFacade.addRolePermission(roleP.getId(), "GameModel:Token:gm20");

        userFacade.deleteRolePermissionsByInstance("gm20");

        List<Map> rolePermission = userFacade.findRolePermissionByInstance("gm20");
        Assert.assertEquals("[]", rolePermission.toString());
    }

    /**
     * Test DeleteAllRolePermissionsById
     */
    @Test
    public void testDeleteAccountPermission() throws Exception {
        userFacade.addAccountPermission(abstractAccount.getId(), "GameModel:Edit:gm100");
        userFacade.addAccountPermission(abstractAccount.getId(), "GameModel:View:gm100");
        userFacade.addAccountPermission(abstractAccount.getId(), "GameModel:Edit:gm200");
        userFacade.addAccountPermission(abstractAccount.getId(), "GameModel:Edit:gm200");

        userFacade.findAccountPermissionByInstance("gm200");

        userFacade.deleteAccountPermissionByInstance("gm100");

//        Assert.assertTrue(accountFacade.find(abstractAccount.getId()).getPermissions().contains(new Permission("GameModel:Edit:gm200")));
        Assert.assertTrue(accountFacade.find(abstractAccount.getId()).getPermissions().get(0).getValue().equals("GameModel:Edit:gm200"));
    }

    /**
     * Test SendNewPassword
     */
    @Test
    public void testSendNewPassword() throws Exception {
        JpaAccount acc = (JpaAccount) accountFacade.findByEmail("a@a.com");
        String oldPwd = acc.getPasswordHex();
        userFacade.sendNewPassword("a@a.com");
        acc = (JpaAccount) accountFacade.findByEmail("a@a.com");
        Assert.assertNotSame(oldPwd, acc.getPasswordHex());
    }

    /**
     * Test CreateSameUser
     */
    @Test(expected = WegasException.class)
    public void testCreateSameUser() throws Exception {
        u.addAccount(abstractAccount);
        userFacade.create(u);
    }
}
