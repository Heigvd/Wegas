/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.exception.NoResultException;
import com.wegas.core.exception.PersistenceException;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.core.exception.WegasException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.guest.GuestToken;
import com.wegas.core.security.persistence.Permission;
import com.wegas.messaging.ejb.EMailFacade;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Schedule;
import javax.ejb.Stateless;
import javax.persistence.EntityManager;
import javax.persistence.PersistenceContext;
import javax.persistence.Query;
import javax.persistence.TemporalType;
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
public class UserFacade extends BaseFacade<User> {

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
    @EJB
    private GameFacade gameFacade;

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
     * @return
     */
    public User guestLogin() {
        if (Helper.getWegasProperty("guestallowed").equals("true")) {
            User newUser = new User(new GuestJpaAccount());                     // return a Guest user
            this.create(newUser);                                               // Persist it

            Subject subject = SecurityUtils.getSubject();
            subject.login(new GuestToken(newUser.getMainAccount().getId()));

            return newUser;
        }
        throw new WegasException("Guset log in not allowed on this server");
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
            throw new NoResultException("Unable to find user");

        }
    }

    @Override
    public void create(User user) {
        AbstractAccount account = user.getMainAccount();
        try {
            if (account instanceof JpaAccount) {                                // @fixme This is only done to have a nice error and not the unparsable ConstraintViolationException
                String mail = ((JpaAccount) account).getEmail();
                if (mail != null && !mail.isEmpty()) {
                    accountFacade.findByEmail(mail);
                    throw new WegasException("This email is already associated with an existing account.");
                }
            }
        } catch (PersistenceException e) {
            // GOTCHA
        }

        super.create(user);
        try {
            account.addRole(roleFacade.findByName("Public"));
        } catch (PersistenceException ex) {
            //logger.error("Unable to find Role: Public", ex);
            logger.error("Unable to find Role: Public");
        }
        try {
            account.addRole(roleFacade.findByName("Registered"));
        } catch (PersistenceException ex) {
            //logger.error("Unable to find Role: Registered", ex);
            logger.error("Unable to find Role: Registered");
        }
        this.em.flush();
    }

    /**
     *
     * @param user
     * @return
     */
    public User findOrCreate(User user) {
        try {
            AbstractAccount account = user.getMainAccount();
            if (account.getId() != null) {
                return accountFacade.find(account.getId()).getUser();
            }
            if (account instanceof JpaAccount) {                                // If user already exists,
                String mail = ((JpaAccount) account).getEmail();
                if (mail != null && !mail.isEmpty()) {
                    return accountFacade.findByEmail(mail).getUser();           // return it
                }
            }
        } catch (PersistenceException e) {
            // GOTCHA
        }
        this.create(user);                                                      // If user could not be found, create and return it
        return user;
    }

    /**
     *
     * @param accounts
     * @return
     */
    public List<User> findOrCreate(List<AbstractAccount> accounts) {
        List<User> ret = new ArrayList<>();
        for (AbstractAccount account : accounts) {
            ret.add(this.findOrCreate(new User(account)));
        }
        return ret;
    }

    /**
     * Get all GameModel permissions by GameModel id
     *
     * @param instance
     * @return
     */
    public List<Map> findRolePermissionByInstance(String instance) {
        Query findByToken = em.createQuery("SELECT DISTINCT roles FROM Role roles JOIN roles.permissions p WHERE p.value LIKE :instance");//@fixme Unable to select role with a like w/ embeddebale
        // Query findByToken = em.createQuery("SELECT DISTINCT roles FROM Role roles WHERE roles.permissions.value = 'mm'");
        // SELECT DISTINCT roles FROM Role roles WHERE roles.permissions LIKE :gameId
        findByToken.setParameter("instance", "%:" + instance);

        List<Role> res = (List<Role>) findByToken.getResultList();
        List<Map> allRoles = new ArrayList<>();
        for (Role unRole : res) {
            Map role = new HashMap<>();
            role.put("id", unRole.getId());
            role.put("name", unRole.getName());
            List<String> permissions = new ArrayList<>();
            role.put("permissions", permissions);

            for (Permission permission : unRole.getPermissions()) {
                String splitedPermission[] = permission.getValue().split(":");
                if (splitedPermission.length >= 3) {
                    if (splitedPermission[2].equals(instance)) {
                        permissions.add(permission.getValue());
                    }
                }
            }
            allRoles.add(role);
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
    public boolean addRolePermission(final Long roleId, final String permission) {
        final Role r = roleFacade.find(roleId);
        return r.addPermission(this.generatePermisssion(permission));
    }

    /**
     *
     * @param abstractAccountId
     * @param permission
     * @return
     */
    public boolean addAccountPermission(final Long abstractAccountId, final String permission) {
        return this.addAccountPermission(abstractAccountId, this.generatePermisssion(permission));
    }

    /**
     *
     * @param abstractAccountId
     * @param p
     * @return
     */
    public boolean addAccountPermission(final Long abstractAccountId, final Permission p) {
        final AbstractAccount a = accountFacade.find(abstractAccountId);
        return a.addPermission(p);
    }

    /**
     *
     * @param a
     * @param permission
     * @return
     */
    public boolean addAccountPermission(final AbstractAccount a, final String permission) {
        return a.addPermission(this.generatePermisssion(permission));
    }

    /**
     *
     * @param permissionStr
     * @return
     */
    public Permission generatePermisssion(final String permissionStr) {
        final Permission p = new Permission(permissionStr);
        final String splitedPermission[] = permissionStr.split(":");
        if (splitedPermission[0].equals(Game.class.getSimpleName()) // If current permission is on game
                && !splitedPermission[1].equals("Token")) {                     // and is not a Token access
            final Long gameId = Long.parseLong(splitedPermission[2].substring(1));
            final Game g = gameFacade.find(gameId);
            p.setInducedPermission("GameModel:View:gm" + g.getGameModelId());   // grant view access on its parent game model

        }
        return p;
    }

    /**
     * Delete permission by role and permission
     *
     * @param roleId
     * @param permission
     * @return
     */
    public boolean deleteRolePermission(Long roleId, String permission) {
        Role r = roleFacade.find(roleId);
        return r.removePermission(permission);
    }

    /**
     * Delete all permission from a role in a Game or GameModel
     *
     * @param roleId
     * @param instance
     * @return
     */
    public boolean deleteRolePermissionsByIdAndInstance(Long roleId, String instance) {
        ArrayList<Permission> currentPermissions = new ArrayList<>();
        Role r = roleFacade.find(roleId);
        for (Permission p : r.getPermissions()) {
            String splitedPermission[] = p.getValue().split(":");
            if (splitedPermission[2].equals(instance)) {
                currentPermissions.add(p);
            }
        }
        return r.getPermissions().removeAll(currentPermissions);
    }

    /**
     * Delete all role permissions by a game or gameModel id
     *
     * @param instance
     */
    public void deleteRolePermissionsByInstance(String instance) {
        List<Role> roles = roleFacade.findAll();
        Iterator<Role> it = roles.iterator();
        Role role;
        Iterator<Permission> itP;
        while (it.hasNext()) {
            role = it.next();
            itP = role.getPermissions().iterator();
            while (itP.hasNext()) {
                String p = itP.next().getValue();
                String splitedPermission[] = p.split(":");
                if (splitedPermission.length >= 3) {
                    if (splitedPermission[2].equals(instance)) {
                        itP.remove();
                    }
                }
            }
        }
    }

    /**
     *
     * @param instance
     * @return
     */
    public List<AbstractAccount> findAccountPermissionByInstance(String instance) {
        Query findByToken = em.createNamedQuery("findUserPermissions");
        findByToken.setParameter("instance", "%:" + instance);
        List<AbstractAccount> accounts = (List<AbstractAccount>) findByToken.getResultList();
        return accounts;
    }

    /**
     *
     * @param instance
     */
    public void deleteAccountPermissionByInstance(String instance) {
        Query findByToken = em.createNamedQuery("findUserPermissions");//@fixme Unable to select role with a like w/ embeddebale
        //  The queries below are all invalid, may be due to an old version of eclipselink
        // Query findByToken = em.createQuery("SELECT DISTINCT abstractaccount FROM AbstractAccount abstractaccount");
        // @NamedQuery(name = "findUserPermissions", query = "SELECT DISTINCT abstractaccount FROM AbstractAccount abstractaccount, IN(abstractaccount.permissions) p WHERE p.inducedPermission LIKE :gameId")
        // @NamedQuery(name = "findUserPermissions", query = "SELECT abstractaccount FROM AbstractAccount abstractaccount WHERE (select count(p) from abstractaccount.permissions p where p.value LIKE :gameId) > 0 ")
        // @NamedQuery(name = "findUserPermissions", query = "SELECT abstractaccount FROM AbstractAccount abstractaccount left outer join fetch abstractaccount.permissions p WHERE p.value LIKE :gameId")

        findByToken.setParameter("instance", "%:" + instance);
        List<AbstractAccount> accounts = (List<AbstractAccount>) findByToken.getResultList();
        for (AbstractAccount a : accounts) {
            for (Iterator<Permission> sit = a.getPermissions().iterator(); sit.hasNext();) {
                Permission p = sit.next();
                String splitedPermission[] = p.getValue().split(":");
                if (splitedPermission.length >= 3) {
                    if (splitedPermission[2].equals(instance)) {
                        sit.remove();
                    }
                }
            }
        }
    }

    /**
     *
     * @param instance
     * @param accountId
     * @throws NoResultException
     */
    public void deleteAccountPermissionByInstanceAndAccount(String instance, Long accountId) throws NoResultException {
        Query findByToken = em.createQuery("SELECT DISTINCT accounts FROM AbstractAccount accounts JOIN accounts.permissions p "
                + "WHERE p.value LIKE '%:" + instance + "' AND p.account.id =" + accountId);
        AbstractAccount account = (AbstractAccount) findByToken.getSingleResult();
        for (Iterator<Permission> sit = account.getPermissions().iterator(); sit.hasNext();) {
            String p = sit.next().getValue();
            String splitedPermission[] = p.split(":");
            if (splitedPermission.length >= 3) {
                if (splitedPermission[2].equals(instance)) {
                    sit.remove();
                }
            }
        }
    }

    /**
     *
     * @param permission
     * @param accountId
     * @throws NoResultException
     */
    public void DeleteAccountPermissionByPermissionAndAccount(String permission, Long accountId) throws NoResultException {
        Query findByToken = em.createQuery("SELECT DISTINCT accounts FROM AbstractAccount accounts JOIN accounts.permissions p "
                + "WHERE p.value LIKE '" + permission + "' AND p.account.id =" + accountId);
        AbstractAccount account = (AbstractAccount) findByToken.getSingleResult();
        //em.detach(account);
        for (Iterator<Permission> sit = account.getPermissions().iterator(); sit.hasNext();) {
            String p = sit.next().getValue();
            String splitedPermission[] = p.split(":");
            if (splitedPermission.length >= 3 && p.equals(permission)) {
                sit.remove();
            }
        }
        //em.merge(account);
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
     * @FIXME Should also remove players, created games and game models
     */
    @Schedule(hour = "9", minute = "14")
    public void removeIdleGuests() {
        Query findIdleGuests = em.createQuery("SELECT DISTINCT account FROM GuestJpaAccount account "
                + "WHERE account.createdTime < :idletime;");
        Calendar calendar = Calendar.getInstance();
        calendar.set(Calendar.MONTH, calendar.get(Calendar.MONTH) - 3);
        findIdleGuests.setParameter("idletime", calendar.getTime(), TemporalType.DATE);

        List<GuestJpaAccount> resultList = findIdleGuests.getResultList();

        for (GuestJpaAccount account : resultList) {
            this.remove(account.getUser());
        }

        logger.info("removeIdleGuests(): " + resultList.size() + " unused guest accounts removed");
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
