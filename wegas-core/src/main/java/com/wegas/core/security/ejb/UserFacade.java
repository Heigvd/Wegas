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
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.rest.util.Email;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.guest.GuestToken;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.messaging.ejb.EMailFacade;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.crypto.RandomNumberGenerator;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.subject.Subject;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Schedule;
import javax.ejb.Stateless;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.persistence.NoResultException;
import javax.persistence.Query;
import javax.persistence.TemporalType;
import javax.persistence.TypedQuery;
import java.util.*;

/**
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
     * @return a User entity, based on the shiro login state
     */
    public User getCurrentUser() {
        final Subject subject = SecurityUtils.getSubject();

        if (subject.isRemembered() || subject.isAuthenticated()) {
            AbstractAccount account = accountFacade.find((Long) subject.getPrincipal());
            if (account != null) {
                return account.getUser();
            }
        }
        throw new WegasNotFoundException("Unable to find user");
    }

    /**
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
        /*
        // The following check is now done by caller UserController.signup()
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
        */

        getEntityManager().persist(user);
        try {
            this.addRole(user, roleFacade.findByName("Public"));
        } catch (WegasNoResultException ex) {
            logger.error("Unable to find Role: Public");
        }
        try {
            this.addRole(user, roleFacade.findByName("Registered"));
        } catch (WegasNoResultException ex) {
            //logger.error("Unable to find Role: Registered", ex);
            logger.error("Unable to find Role: Registered");
        }
        this.getEntityManager().flush();
    }

    @Override
    public void remove(User entity) {
        for (Role r : entity.getRoles()) {
            r.removeUser(entity);
        }
        /* ??? */
        for (AbstractAccount aa : entity.getAccounts()) {
            accountFacade.remove(aa);
        }

        getEntityManager().remove(entity);
    }

    /**
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

    public boolean addUserPermission(final Long userId, final String permission) {
        return this.addUserPermission(userId, this.generatePermisssion(permission));
    }

    public boolean addUserPermission(final Long userId, final Permission p) {
        final User user = this.find(userId);
        return user.addPermission(p);
    }

    public boolean addUserPermission(final User user, final String permission) {
        return user.addPermission(this.generatePermisssion(permission));
    }

    /**
     * @param abstractAccountId
     * @param permission
     * @return
     */
    public boolean addAccountPermission(final Long abstractAccountId, final String permission) {
        return this.addAccountPermission(abstractAccountId, this.generatePermisssion(permission));
    }

    /**
     * @param abstractAccountId
     * @param p
     * @return
     */
    public boolean addAccountPermission(final Long abstractAccountId, final Permission p) {
        final AbstractAccount a = accountFacade.find(abstractAccountId);
        return a.getUser().addPermission(p);
    }

    /**
     * @param a
     * @param permission
     * @return
     */
    public boolean addAccountPermission(final AbstractAccount a, final String permission) {
        return a.getUser().addPermission(this.generatePermisssion(permission));
    }

    /**
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
     * @param instance
     * @return
     */
    public List<User> findUserPermissionByInstance(String instance) {
        final TypedQuery<User> findByToken = getEntityManager().createNamedQuery("User.findUserPermissions", User.class);
        findByToken.setParameter("instance", "%:" + instance);
        return findByToken.getResultList();
    }

    public List<User> findUsersWithRole(Long role_id) {
        final TypedQuery<User> findWithRole = getEntityManager().createNamedQuery("User.findUsersWithRole", User.class);
        findWithRole.setParameter("role_id", role_id);
        return findWithRole.getResultList();
    }

    /**
     * @param instance
     */
    public void deleteUserPermissionByInstance(String instance) {
        /*
        Query query = getEntityManager().createNamedQuery("Permission.deleteByInstance");
        query.setParameter("instance", "%:" + instance);
        query.executeUpdate();
         */

        Query findByToken = getEntityManager().createNamedQuery("User.findUserPermissions");

        findByToken.setParameter("instance", "%:" + instance);
        List<User> users = (List<User>) findByToken.getResultList();
        for (User user : users) {
            for (Iterator<Permission> sit = user.getPermissions().iterator(); sit.hasNext(); ) {
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
     * @param instance
     * @param userId
     */
    public void deleteUserPermissionByInstanceAndUser(String instance, Long userId) {
        final TypedQuery<User> findByToken = getEntityManager().createNamedQuery("User.findUserWithPermission", User.class);
        findByToken.setParameter("permission", "%:" + instance)
                .setParameter("userId", userId);
        try {
            User user = findByToken.getSingleResult();
            for (Iterator<Permission> sit = user.getPermissions().iterator(); sit.hasNext(); ) {
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
     * @param permission
     * @param userId
     */
    public void deleteUserPermissionByPermissionAndAccount(String permission, Long userId) {
        final TypedQuery<User> findByToken = getEntityManager().createNamedQuery("User.findUserWithPermission", User.class);
        findByToken.setParameter("permission", permission)
                .setParameter("userId", userId);
        try {
            User user = findByToken.getSingleResult();
            for (Iterator<Permission> sit = user.getPermissions().iterator(); sit.hasNext(); ) {
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
     * @param email
     */
    public void sendNewPassword(String email) {
        try {
            JpaAccount acc = accountFacade.findByEmail(email);
            EMailFacade emailFacade = new EMailFacade();
            RandomNumberGenerator rng = new SecureRandomNumberGenerator();
            String newPassword = rng.nextBytes().toHex().substring(0, 12);
            String subject = "Wegas account";
            String body = "A new password for your wegas account has been successfully created: " + newPassword;
            String from = "noreply@" + Helper.getWegasProperty("mail.default_domain");
            if (acc != null) {
                acc.setPassword(newPassword);
                acc.setPasswordHex(null);                                           //force JPA update
                emailFacade.send(acc.getEmail(), from, null, subject, body, Message.RecipientType.TO, "text/plain", true);
            }
        } catch (WegasNoResultException | MessagingException ex) {
            System.out.println(ex);
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
        emailFacade.send(to.toString(), email.getFrom(), email.getReplyTo(), email.getSubject(), email.getBody(), Message.RecipientType.BCC, "text/html", false);
    }

    /**
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
     * @param playerId
     * @return
     */
    public boolean matchCurrentUser(Long playerId) {
        return this.getCurrentUser().equals(playerFacade.find(playerId).getUser());
    }

    /**
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
     * @param gmId
     * @param newGmId
     */
    public void duplicatePermissionByInstance(String gmId, String newGmId) {
        List<User> users = this.findUserPermissionByInstance(gmId);
        String splitedPermission[];
        for (User user : users) {
            List<Permission> perm = user.getPermissions();
            for (int ii = 0; ii < perm.size(); ii++) {
                if (perm.get(ii).getValue().contains(gmId)) {
                    splitedPermission = perm.get(ii).getValue().split(":");
                    String newPerm = splitedPermission[0] + ":" + splitedPermission[1] + ":" + newGmId;
                    this.addUserPermission(user.getId(), newPerm);
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

    /**
     * Transfer players and permission from one user to another
     *
     * @param from the player to take perm and players from
     * @param to   the whow
     */
    public void transferPlayers(User from, User to) {
        final List<Long> gameIds = new ArrayList<>();
        for (Player player : to.getPlayers()) {
            gameIds.add(player.getGame().getId());
        }
        for (Player p : from.getPlayers()) {
            if (!gameIds.contains(p.getGame().getId())) { // User already has a player in p's game
                p.setName(to.getName());
                p.setUser(to);
            }
        }
        for (Permission p : from.getPermissions()) {
            p.setUser(to);
        }
    }

    public void upgradeGuest(GuestJpaAccount guest, JpaAccount account) {
        User user = guest.getUser();
        user.addAccount(account);

        accountFacade.create(account);
        // Detach and delete account
        accountFacade.remove(guest.getId());

        this.refresh(user);
        for (Player p : user.getPlayers()) {
            p.setName(user.getName());
        }

    }

    public void addRole(User u, Role r) {
        u.addRole(r);
        r.addUser(u);
    }

    public void addRole(Long uId, Long rId) {
        User u = this.find(uId);
        Role r = roleFacade.find(rId);
        this.addRole(u, r);
    }
}
