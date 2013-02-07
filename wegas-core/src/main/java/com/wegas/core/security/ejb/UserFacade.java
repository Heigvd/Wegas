/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.AbstractFacadeImpl;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.exception.PersistenceException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.GuestAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.messaging.ejb.EMailFacade;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.crypto.RandomNumberGenerator;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.subject.Subject;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@LocalBean
public class UserFacade extends AbstractFacadeImpl<User> {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(UserFacade.class);
    /**
     *
     */
    @PersistenceContext(unitName = "wegasPU")
    private EntityManager em;
    /**
     *
     */
    @EJB
    private AccountFacade accountFacade;
    /**
     *
     */
    @EJB
    private RoleFacade roleFacade;
    /**
     *
     */
    @EJB
    private PlayerFacade playerFacade;

    /**
     *
     */
    public UserFacade() {
        super(User.class);
    }

    /**
     *
     * @return
     */
    @Override
    protected EntityManager getEntityManager() {
        return em;
    }

    /**
     *
     *
     * @return a User entity, based on the shiro login state
     */
    public User getCurrentUser() {
        final Subject subject = SecurityUtils.getSubject();
        if (subject.isRemembered() || subject.isAuthenticated()) {
            return accountFacade.find((Long) subject.getPrincipal()).getUser();
        } else {
            User newUser = new User(new GuestAccount());                        // return a Guest user
            if (Helper.getWegasProperty("guestallowed").equals("true")) {
                //userFacade.create(newUser);                                   // @fixme For now we do not persist this new user
            }
            return newUser;
        }
    }

    /**
     *
     * @param userId
     * @return
     */
    public List<Game> registeredGames(Long userId) {
        User user = this.find(userId);
        List<Game> ret = new ArrayList<>();
        for (Player p : user.getPlayers()) {
            ret.add(p.getGame());
        }
        return ret;
    }

    @Override
    public void create(User user) {
        super.create(user);
        try {
            user.getMainAccount().addRole(roleFacade.findByName("Public"));
        } catch (PersistenceException ex) {
            logger.error("Unable to find Role: Administrator", ex);
        }
        try {
            user.getMainAccount().addRole(roleFacade.findByName("Registered"));
        } catch (PersistenceException ex) {
            logger.error("Unable to find Role: Registered", ex);
        }
    }

    /**
     * Get all GameModel permissions by GameModel id
     *
     * @param id
     * @return
     */
    public List<Map> findPermissionByInstance(String id) {

        Query findByToken = em.createNamedQuery("findPermissionByGameModelId");
        findByToken.setParameter("gameId", "%:" + id);
        List<Role> res = (List<Role>) findByToken.getResultList();
        List<Map> allRoles = new ArrayList<>();
        for (Role unRole : res) {
            Map role = new HashMap<>();
            allRoles.add(role);
            role.put("id", unRole.getId());
            role.put("name", unRole.getName());
            List<String> permissions = new ArrayList<>();
            role.put("permissions", permissions);

            for (String permission : unRole.getPermissions()) {
                String splitedPermission[] = permission.split(":");
                if (splitedPermission.length >= 3) {
                    if (splitedPermission[2].equals(id)) {
                        permissions.add(permission);
                    }
                }
            }
        }

        return allRoles;
    }

    /**
     * Create role_permissions
     *
     * @param roleId
     * @param permission
     * @return
     */
    public boolean addPermissionsByInstance(Long roleId, String permission) {
        boolean added = false;
        boolean exist = false;
        Role r = roleFacade.find(roleId);
        for (String p : r.getPermissions()) {
            if (p.equals(permission)) {
                exist = true;
            }
        }

        if (!exist) {
            added = r.getPermissions().add(permission);
        }

        return added;
    }

    /**
     * Delete permission by role and permission
     *
     * @param roleId
     * @param permission
     * @return
     */
    public boolean deletePermissionByInstance(Long roleId, String permission) {
        String permissionToRemove = null;
        Role r = roleFacade.find(roleId);
        for (String p : r.getPermissions()) {
            if (p.equals(permission)) {
                permissionToRemove = p;
            }
        }
        return r.getPermissions().remove(permissionToRemove);
    }

    /**
     * Delete all permission from a role in a Game or GameModel
     *
     * @param roleId
     * @param gameModelId
     * @return
     */
    public boolean deleteAllRolePermissions(Long roleId, String gameModelId) {
        ArrayList<String> currentPermissions = new ArrayList<>();
        Role r = roleFacade.find(roleId);
        for (String p : r.getPermissions()) {
            String splitedPermission[] = p.split(":");
            if (splitedPermission[2].equals(gameModelId)) {
                currentPermissions.add(p);
            }
        }
        return r.getPermissions().removeAll(currentPermissions);
    }

    /**
     * Delete all role permissions by a game or gameModel id
     *
     * @param gOrGmId
     */
    public void deleteAllRolePermissionsById(String gOrGmId) {
        List<Role> roles = roleFacade.findAll();
        Iterator<Role> it = roles.iterator();
        Role role;
        Iterator<String> itP;
        String p;
        while (it.hasNext()) {
            role = it.next();
            itP = role.getPermissions().iterator();
            while (itP.hasNext()) {
                p = itP.next();
                String splitedPermission[] = p.split(":");
                if (splitedPermission.length >= 3) {
                    if (splitedPermission[2].equals(gOrGmId)) {
                        itP.remove();
                    }
                }
            }
        }
    }

    /**
     *
     * @param gameOrGameModelId
     */
    public void deleteUserPermissionByInstance(String gameOrGameModelId) {
        Query findByToken = em.createNamedQuery("findUserPermissions");
        findByToken.setParameter("gameId", "%:" + gameOrGameModelId);
        List<AbstractAccount> accounts = (List<AbstractAccount>) findByToken.getResultList();
        for (AbstractAccount a : accounts) {
            em.detach(a);
            for (Iterator<String> sit = a.getPermissions().iterator(); sit.hasNext();) {
                String p = sit.next();
                String splitedPermission[] = p.split(":");
                if (splitedPermission.length >= 3) {
                    if (splitedPermission[2].equals(gameOrGameModelId)) {
                        sit.remove();
                    }
                }
            }
            em.merge(a);
        }


    }

    /**
     *
     * @param email
     */
    public void sendNewPassword(String email) {
        JpaAccount acc = (JpaAccount) accountFacade.findByEmail(email);
        EMailFacade emailFacade = new EMailFacade();
        RandomNumberGenerator rng = new SecureRandomNumberGenerator();
        String newPassword = rng.nextBytes().toHex().substring(0, 12);
        String subject = "Wegas account";
        String body = "A new password for your wegas account has been successfully created: " + newPassword;
        if (acc != null) {
            emailFacade.send(acc.getEmail(), "admin@wegas.com", subject, body);
            acc.setPassword(newPassword);
            acc.setPasswordHex(null);                                           //force JPA update
        }
    }

    /**
     *
     * @param account
     */
    public void update(JpaAccount account) {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    /**
     *
     * @param playerId
     * @return
     */
    public boolean matchCurrentUser(Long playerId) {
        return this.getCurrentUser().equals(playerFacade.find(playerId).getUser());
    }
}
