/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.wegas.core.Helper;
import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.rest.util.Email;
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
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.ejb.EJB;
import javax.ejb.EJBTransactionRolledbackException;
import javax.ejb.LocalBean;
import javax.ejb.Schedule;
import javax.ejb.Stateless;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.persistence.NoResultException;
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
    public User guestLogin() {
        if (Helper.getWegasProperty("guestallowed").equals("true")) {
            User newUser = new User(new GuestJpaAccount());                     // return a Guest user
            this.create(newUser);                                               // Persist it

            Subject subject = SecurityUtils.getSubject();
            subject.login(new GuestToken(newUser.getMainAccount().getId()));

            return newUser;
        }
        throw WegasErrorMessage.error("Guest log in not allowed on this server");
    }

    /**
     * logout current user
     */
    public void logout() {
        SecurityUtils.getSubject().logout();
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
            throw new WegasNotFoundException("Unable to find user");
        }
    }

    /**
     *
     *
     * @param username String representing the username
     * @return a User entity, based on the username
     */
    public User getUserByUsername(String username) {
        User u = null;
        try {
            u = accountFacade.findByUsername(username).getUser();
        } catch (WegasNoResultException e) {
        }
        return u;
    }

    @Override
    public void create(User user) {
        AbstractAccount account = user.getMainAccount();
        try {
            if (account instanceof JpaAccount) {                                // @fixme This is only done to have a nice error and not the unparsable ConstraintViolationException
                String mail = ((JpaAccount) account).getEmail();
                if (mail != null && !mail.isEmpty()) {
                    accountFacade.findByEmail(mail);
                    throw WegasErrorMessage.error("This email is already associated with an existing account.");
                }
            }
        } catch (WegasNoResultException | EJBTransactionRolledbackException e) {
            // GOTCHA
            // E-Mail not yet registered -> proceed 
        }

        super.create(user);
        try {
            account.addRole(roleFacade.findByName("Public"));
        } catch (WegasNoResultException ex) {
            logger.error("Unable to find Role: Public");
        }
        try {
            account.addRole(roleFacade.findByName("Registered"));
        } catch (WegasNoResultException ex) {
            //logger.error("Unable to find Role: Registered", ex);
            logger.error("Unable to find Role: Registered");
        }
        this.getEntityManager().flush();
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
        } catch (WegasNoResultException ex) {
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
            User u = this.findOrCreate(new User(account));
            if (!ret.contains(u)) {
                ret.add(u);
            }
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
        Query findByToken = getEntityManager().createQuery("SELECT DISTINCT roles FROM Role roles JOIN roles.permissions p WHERE p.value LIKE :instance");//@fixme Unable to select role with a like w/ embeddebale
        // Query findByToken = getEntityManager().createQuery("SELECT DISTINCT roles FROM Role roles WHERE roles.permissions.value = 'mm'");
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
        Query findByToken = getEntityManager().createNamedQuery("findUserPermissions");
        findByToken.setParameter("instance", "%:" + instance);
        List<AbstractAccount> accounts = (List<AbstractAccount>) findByToken.getResultList();
        return accounts;
    }

    /**
     *
     * @param instance
     */
    public void deleteAccountPermissionByInstance(String instance) {
        Query findByToken = getEntityManager().createNamedQuery("findUserPermissions");//@fixme Unable to select role with a like w/ embeddebale
        //  The queries below are all invalid, may be due to an old version of eclipselink
        // Query findByToken = getEntityManager().createQuery("SELECT DISTINCT abstractaccount FROM AbstractAccount abstractaccount");
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
     */
    public void deleteAccountPermissionByInstanceAndAccount(String instance, Long accountId) {
        Query findByToken = getEntityManager().createQuery("SELECT DISTINCT accounts FROM AbstractAccount accounts JOIN accounts.permissions p "
                + "WHERE p.value LIKE '%:" + instance + "' AND p.account.id =" + accountId);
        try {
            AbstractAccount account = (AbstractAccount) findByToken.getSingleResult();
            for (Iterator<Permission> sit = account.getPermissions().iterator(); sit.hasNext();) {
                String p = sit.next().getValue();
                String splitedPermission[] = p.split(":");
                if (splitedPermission.length >= 3) {
                    if (splitedPermission[2].equals(instance)) {
                        if (this.checkHasLastEditPermission(p, instance)) {
                            sit.remove();
                        } else {
                            throw WegasErrorMessage.warn("this is not possible because there must be at least one super user");
                        }
                    }
                }
            }
        } catch (NoResultException e) {
            //Gotcha
        }
    }

    /**
     *
     * @param permission
     * @param accountId
     */
    public void deleteAccountPermissionByPermissionAndAccount(String permission, Long accountId) {
        Query findByToken = getEntityManager().createQuery("SELECT DISTINCT accounts FROM AbstractAccount accounts JOIN accounts.permissions p "
                + "WHERE p.value LIKE '" + permission + "' AND p.account.id =" + accountId);
        try {
            AbstractAccount account = (AbstractAccount) findByToken.getSingleResult();
            for (Iterator<Permission> sit = account.getPermissions().iterator(); sit.hasNext();) {
                String p = sit.next().getValue();
                String splitedPermission[] = p.split(":");
                if (splitedPermission.length >= 3 && p.equals(permission)) {
                    if (this.checkHasLastEditPermission(permission, splitedPermission[2])) {
                        sit.remove();
                    } else {
                        throw WegasErrorMessage.warn("this is not possible because there must be at least one super user");
                    }
                }
            }
        } catch (NoResultException e) {
            //Gotcha
        }

    }

    /**
     *
     * @param email
     */
    public void sendNewPassword(String email) {
        try {
            JpaAccount acc = (JpaAccount) accountFacade.findByEmail(email);
            EMailFacade emailFacade = new EMailFacade();
            RandomNumberGenerator rng = new SecureRandomNumberGenerator();
            String newPassword = rng.nextBytes().toHex().substring(0, 12);
            String subject = "Wegas account";
            String body = "A new password for your wegas account has been successfully created: " + newPassword;
            String from = "noreply@" + Helper.getWegasProperty("mail.default_domain");
            if (acc != null) {
                emailFacade.send(acc.getEmail(), from, null, subject, body, Message.RecipientType.TO, "text/plain");
                acc.setPassword(newPassword);
                acc.setPasswordHex(null);                                           //force JPA update
            }
        } catch (WegasNoResultException | MessagingException ex) {
        }
    }

    public void sendEmail(Email email) throws MessagingException {
        StringBuilder to = new StringBuilder();
        for (Player p : email.getTo()) {
            Player rP = playerFacade.find(p.getId());
            AbstractAccount mainAccount = rP.getUser().getMainAccount();
            if (mainAccount instanceof JpaAccount) {
                JpaAccount jpaAccount = (JpaAccount) mainAccount;
                to.append(jpaAccount.getEmail());
                to.append(",");
            }
        }
        EMailFacade emailFacade = new EMailFacade();
        emailFacade.send(to.toString(), email.getFrom(), email.getReplyTo(), email.getSubject(), email.getBody(), Message.RecipientType.BCC, "text/html");
    }

    /**
     *
     * @FIXME Should also remove players, created games and game models
     */
    @Schedule(hour = "4", minute = "12")
    public void removeIdleGuests() {
        logger.info("removeIdleGuests(): unused guest accounts will be removed");
        Query findIdleGuests = getEntityManager().createQuery("SELECT DISTINCT account FROM GuestJpaAccount account "
                + "WHERE account.createdTime < :idletime");
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

    /**
     *
     * @param accountRoles
     * @param compareRoles
     * @return
     */
    public boolean hasRoles(ArrayList<String> accountRoles, ArrayList<Role> compareRoles) {
        for (int i = 0; i < accountRoles.size(); i++) {
            for (int ii = 0; ii < compareRoles.size(); ii++) {
                if (accountRoles.get(i).equals(compareRoles.get(ii).getName())) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     *
     * @param gmId
     * @param newGmId
     */
    public void duplicatePermissionByInstance(String gmId, String newGmId) {
        List<AbstractAccount> accounts = this.findAccountPermissionByInstance(gmId);
        String splitedPermission[];
        for (AbstractAccount account : accounts) {
            List<Permission> perm = account.getPermissions();
            for (int ii = 0; ii < perm.size(); ii++) {
                if (perm.get(ii).getValue().contains(gmId)) {
                    splitedPermission = perm.get(ii).getValue().split(":");
                    String newPerm = splitedPermission[0] + ":" + splitedPermission[1] + ":" + newGmId;
                    this.addAccountPermission(account.getId(), newPerm);
                }
            }
        }
    }

    private boolean checkHasLastEditPermission(String permission, String instance) {
        boolean isNotLastEdit = false;
        if (permission.contains("Edit")) {
            Query getEditPermissions = getEntityManager().createQuery("SELECT p FROM Permission p WHERE p.value LIKE :instance");
            getEditPermissions.setParameter("instance", "%Edit%:" + instance);
            List<Permission> listEditPermissions = getEditPermissions.getResultList();
            if (listEditPermissions.size() > 1) {
                isNotLastEdit = true;
            }
        } else {
            isNotLastEdit = true;
        }
        return isNotLastEdit;
    }
}
