/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.ejb;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.ILock;
import com.wegas.core.Helper;
import com.wegas.core.ejb.BaseFacade;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.GameModelFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.rest.util.Email;
import com.wegas.core.security.aai.AaiAccount;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.guest.GuestToken;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.SecurityHelper;
import com.wegas.messaging.ejb.EMailFacade;
import java.util.*;
import java.util.regex.Matcher;
import javax.ejb.EJB;
import javax.ejb.LocalBean;
import javax.ejb.Schedule;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.mail.Message;
import javax.mail.MessagingException;
import javax.naming.NamingException;
import javax.persistence.TemporalType;
import javax.persistence.TypedQuery;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.crypto.RandomNumberGenerator;
import org.apache.shiro.crypto.SecureRandomNumberGenerator;
import org.apache.shiro.subject.Subject;
import org.slf4j.LoggerFactory;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@LocalBean
public class UserFacade extends BaseFacade<User> {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(UserFacade.class);

    @Inject
    private HazelcastInstance hzInstance;

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
    private TeamFacade teamFacade;

    /**
     *
     */
    @EJB
    private GameFacade gameFacade;

    /**
     *
     */
    @Inject
    private GameModelFacade gameModelFacade;

    /**
     *
     */
    public UserFacade() {
        super(User.class);
    }

    /**
     * Login as guest
     *
     * @return the just logged user
     *
     * @throws WegasErrorMessage when guest not allowed
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
        Subject subject = SecurityUtils.getSubject();
        if (subject.isRunAs()) {
            subject.releaseRunAs();
        } else {
            subject.logout();
        }
    }

    /**
     * @return a User entity, based on the shiro login state
     */
    public AbstractAccount getCurrentAccount() {
        final Subject subject = SecurityUtils.getSubject();

        if (subject.isRemembered() || subject.isAuthenticated()) {
            return accountFacade.find((Long) subject.getPrincipal());
        }
        throw new WegasNotFoundException("Unable to find an account");
    }

    /**
     * @return a User entity, based on the shiro login state
     */
    public User getCurrentUser() {
        User currentUser = this.getCurrentUserOrNull();
        if (currentUser != null) {
            return currentUser;
        }
        throw new WegasNotFoundException("Unable to find user");
    }

    /**
     * Same as {@link #getCurrentUser() } but return null rather than throwing an exception
     *
     * @return the current user or null if current subject is not authenticated
     */
    public User getCurrentUserOrNull() {
        final Subject subject = SecurityUtils.getSubject();

        if (subject.isRemembered() || subject.isAuthenticated()) {
            AbstractAccount account = accountFacade.find((Long) subject.getPrincipal());
            if (account != null) {
                return account.getUser();
            }
        }
        return null;
    }

    /**
     * @param username String representing the username
     *
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

    /**
     * @param persistentId String representing the user
     *
     * @return a User entity, based on the persistentId
     */
    public User getUserByPersistentId(String persistentId) {
        User u = null;
        try {
            u = accountFacade.findByPersistentId(persistentId).getUser();
        } catch (WegasNoResultException e) {
        }
        return u;
    }

    @Override
    public void create(User user) {
//        AbstractAccount account = user.getMainAccount();
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

        /*
         * Very strange behaviour: without this flush, RequestManages faild to be injected within others beans...
         */
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

        for (Player player : entity.getPlayers()) {
            player.setUser(null);
        }

        getEntityManager().remove(entity);
    }

    /**
     * @param user
     *
     * @return try to
     *
     * @deprecated
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
     *
     * @return list of user
     *
     * @deprecated
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
     * Get all roles which have some permissions on the given instance..
     * <p>
     * Map is { id : role id, name: role name, permissions: list of permissions
     * related to instance}
     *
     * @param instance
     *
     * @return list of "Role"
     */
    public List<Map> findRolePermissionByInstance(String instance) {
        TypedQuery<Role> findByToken = getEntityManager().createQuery("SELECT DISTINCT roles FROM Role roles JOIN roles.permissions p WHERE p.value LIKE :instance", Role.class);//@fixme Unable to select role with a like w/ embeddebale
        // Query findByToken = getEntityManager().createQuery("SELECT DISTINCT roles FROM Role roles WHERE roles.permissions.value = 'mm'");
        // SELECT DISTINCT roles FROM Role roles WHERE roles.permissions LIKE :gameId
        findByToken.setParameter("instance", "%:" + instance);

        List<Role> res = findByToken.getResultList();
        List<Map> allRoles = new ArrayList<>();
        for (Role unRole : res) {
            Map<String, Object> role = new HashMap<>();
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
     * @param roleId     id of the role to add permission too
     * @param permission permission to add
     *
     * @return true if the permission has successfully been added
     */
    public boolean addRolePermission(final Long roleId, final String permission) {
        final Role r = roleFacade.find(roleId);
        return r.addPermission(this.generatePermisssion(permission));
    }

    /**
     *
     * @param userId     id of the user
     * @param permission permission to add
     *
     * @return true if the permission has successfully been added
     */
    public boolean addUserPermission(final Long userId, final String permission) {
        return this.addUserPermission(userId, this.generatePermisssion(permission));
    }

    /**
     * @param userId id of the user
     * @param p      permission to add
     *
     * @return true if the permission has successfully been added
     */
    public boolean addUserPermission(final Long userId, final Permission p) {
        final User user = this.find(userId);
        return user.addPermission(p);
    }

    /**
     *
     * @param user
     * @param permission
     *
     * @return true if the permission has successfully been added
     */
    public boolean addUserPermission(final User user, final String permission) {
        return user.addPermission(this.generatePermisssion(permission));
    }

    /**
     *
     * @param user
     * @param permission
     * @param inducedPermission
     *
     * @return true if the permission has successfully been added
     */
    public boolean addUserPermission(final User user, final String permission, final String inducedPermission) {
        Permission p = new Permission(permission, inducedPermission);
        return user.addPermission(p);
    }

    /**
     * Generate a Permission based on its string representation
     *
     * @param permissionStr string representation of the permission
     *
     * @return the generated permission
     */
    private Permission generatePermisssion(final String permissionStr) {
        final Permission p = new Permission(permissionStr);
        final String splitedPermission[] = permissionStr.split(":");

        if (splitedPermission[0].equals(Game.class.getSimpleName())) {
            final Long gameId = Long.parseLong(splitedPermission[2].substring(1));
            final Game g = gameFacade.find(gameId);
            p.setInducedPermission("GameModel:View:gm" + g.getGameModelId());   // grant view access on its parent game model
        }
        return p;
    }

    /**
     * @param instance
     *
     * @return all user which have a permission related to the given instance
     */
    public List<User> findUserByPermissionInstance(String instance) {
        final TypedQuery<User> findByToken = getEntityManager().createNamedQuery("User.findUserPermissions", User.class);
        findByToken.setParameter("instance", "%:" + instance);
        return findByToken.getResultList();
    }

    /**
     * @param instance
     *
     * @return all user which have a permission related to the given instance
     */
    public List<User> findEditors(String instance) {
        String permission;
        if (instance.substring(0, 2).equals("gm")) {
            permission = "GameModel:%Edit%:";
        } else {
            permission = "Game:%Edit%:";
        }

        final TypedQuery<User> findByToken = getEntityManager().createNamedQuery("User.findUserPermissions", User.class);
        findByToken.setParameter("instance", permission + instance);
        return findByToken.getResultList();
    }

    /**
     * Get all users is
     *
     * @param role_id
     *
     * @return all role members
     */
    public List<User> findUsersWithRole(Long role_id) {
        /* Why not using JPA ?
        return roleFacade.find(role_id).getUsers(); ??????
         */
        final TypedQuery<User> findWithRole = getEntityManager().createNamedQuery("User.findUsersWithRole", User.class);
        findWithRole.setParameter("role_id", role_id);
        return findWithRole.getResultList();
    }

    private void deletePermission(Permission p) {
        if (p.getUser() != null) {
            this.find(p.getUser().getId()).removePermission(p);
        }
        if (p.getRole() != null) {
            roleFacade.find(p.getRole().getId()).removePermission(p);
        }
    }

    private List<Permission> findUserPermissions(String permission, User user) {
        TypedQuery<Permission> query = getEntityManager().createNamedQuery("Permission.findByPermissionAndUser", Permission.class);
        query.setParameter("userId", user.getId());
        query.setParameter("permission", permission);

        return query.getResultList();
    }

    public void deletePermissions(User user, String permission) {
        for (Permission p : this.findUserPermissions(permission, user)) {
            this.deletePermission(p);
        }
    }

    public void deletePermissions(Game game) {
        this.deletePermissions("Game:%:g" + game.getId());
    }

    public void deletePermissions(GameModel gameModel) {
        this.deletePermissions("GameModel:%:gm" + gameModel.getId());
    }

    private void deletePermissions(String permission) {
        TypedQuery<Permission> query = getEntityManager().createNamedQuery("Permission.findByPermission", Permission.class);
        query.setParameter("permission", permission);

        for (Permission p : query.getResultList()) {
            this.deletePermission(p);
        }
    }

    /**
     *
     * @param trainerId
     * @param gameId
     */
    public void addTrainerToGame(Long trainerId, Long gameId) {
        Game game = gameFacade.find(gameId);
        User user = this.find(trainerId);
        this.addUserPermission(user, "Game:View,Edit:g" + gameId, "GameModel:View,Edit:gm" + game.getGameModelId());
    }

    public void removeTrainer(Long gameId, User trainer) {

        if (this.getCurrentUser().equals(trainer)) {
            throw WegasErrorMessage.error("Cannot remove yourself");
        }

        if (this.findEditors("g" + gameId).size() <= 1) {
            throw WegasErrorMessage.error("Cannot remove last trainer");
        } else {
            this.deletePermissions(trainer, "Game:%Edit%:g" + gameId);
        }
    }

    /**
     *
     * @param userId
     * @param gameModelId
     * @param permissions
     */
    public void grantGameModelPermissionToUser(Long userId, Long gameModelId, String permissions) {
        User user = this.find(userId);

        /*
         * Revoke previous permissions (do not use removeScenarist method since
         * this method prevents to remove one own permissions,
         */
        this.deletePermissions(user, "GameModel:%:gm" + gameModelId);

        // Grant new permission
        this.addUserPermission(user, "GameModel:" + permissions + ":gm" + gameModelId);
    }

    public void removeScenarist(Long gameModelId, User scenarist) {
        if (this.getCurrentUser().equals(scenarist)) {
            throw WegasErrorMessage.error("Cannot remove yourself");
        }

        if (this.findEditors("gm" + gameModelId).size() <= 1) {
            throw WegasErrorMessage.error("Cannot remove last scenarist");
        } else {
            //remove all permission matching  both gameModelId and userId
            this.deletePermissions(scenarist, "GameModel:%:gm" + gameModelId);
        }
    }

    /**
     * @param email
     */
    public void sendNewPassword(String email) {
        try {
            JpaAccount acc = accountFacade.findJpaByEmail(email);
            EMailFacade emailFacade = new EMailFacade();
            RandomNumberGenerator rng = new SecureRandomNumberGenerator();
            String newPassword = rng.nextBytes().toHex().substring(0, 12);
            String subject = "Wegas account";
            String body = "A new password for your wegas account has been successfully created: " + newPassword;
            String from = "noreply@" + Helper.getWegasProperty("mail.default_domain");
            if (acc != null) {
                acc.setPassword(newPassword);
                acc.setPasswordHex(null);                                           //force JPA update
                emailFacade.send(acc.getEmail(), from, null, subject, body, Message.RecipientType.TO, "text/plain; charset=utf-8", true);
            }
        } catch (WegasNoResultException | MessagingException ex) {
            logger.error("Error while sending new password for email: " + email, ex);
        }
    }

    /*
    ** Sends the given email as one separate message per addressee (as a measure against spam filters)
    ** and an additional one to the sender to provide him a copy of the message.
    ** If an address is invalid (but syntactically correct), it should not prevent from sending to the other addressees.
     */
    public void sendEmail(Email email) /* throws MessagingException */ {
        int nbExceptions = 0;
        EMailFacade emailFacade = new EMailFacade();
        for (Player p : email.getTo()) {
            Player rP = playerFacade.find(p.getId());
            AbstractAccount mainAccount = rP.getUser().getMainAccount();
            if (mainAccount instanceof JpaAccount || mainAccount instanceof AaiAccount) {
                try {
                    emailFacade.send(mainAccount.getEmail(), email.getFrom(), email.getReplyTo(), email.getSubject(), email.getBody(), Message.RecipientType.TO, "text/html; charset=utf-8", true);
                } catch (MessagingException e) {
                    nbExceptions++;
                }
            }
        }
        try {
            // Send a last message directly to the sender as a confirmation copy
            emailFacade.send(email.getReplyTo(), email.getFrom(), email.getReplyTo(), email.getSubject(), email.getBody(), Message.RecipientType.TO, "text/html; charset=utf-8", true);
        } catch (MessagingException e) {
            nbExceptions++;
        }
        if (nbExceptions > 0) {
            throw WegasErrorMessage.error(nbExceptions + " error(s) while sending email");
        }
    }

    /*
     * @FIXME Should also remove players, created games and game models
     */
    /**
     * Remove old idle guests
     */
    @Schedule(hour = "4", minute = "12")
    public void removeIdleGuests() {
        ILock lock = hzInstance.getLock("UserFacade.Schedule");

        if (lock.tryLock()) {
            try {
                logger.info("removeIdleGuests(): unused guest accounts will be removed");
                TypedQuery<GuestJpaAccount> findIdleGuests = getEntityManager().createQuery("SELECT DISTINCT account FROM GuestJpaAccount account "
                        + "WHERE account.createdTime < :idletime", GuestJpaAccount.class);
                Calendar calendar = Calendar.getInstance();
                calendar.set(Calendar.MONTH, calendar.get(Calendar.MONTH) - 3);
                findIdleGuests.setParameter("idletime", calendar.getTime(), TemporalType.DATE);

                List<GuestJpaAccount> resultList = findIdleGuests.getResultList();

                for (GuestJpaAccount account : resultList) {
                    this.remove(account.getUser());
                }

                //Force flush before closing RequestManager !
                getEntityManager().flush();

                logger.info("removeIdleGuests(): " + resultList.size() + " unused guest accounts removed (idle since: " + calendar.getTime() + ")");

            } finally {
                lock.unlock();
                lock.destroy();
            }
        }
    }

    /**
     * Is the given playerId identify a player owned by the current user players
     * ?
     *
     * @param playerId
     *
     * @return true if the player is owned by the current user
     */
    public boolean matchCurrentUser(Long playerId) {
        return this.getCurrentUser().equals(playerFacade.find(playerId).getUser());
    }

    /**
     *
     * @param roleNames
     * @param user
     *
     * @return true if user is member of at least one group from the list
     */
    public boolean hasAnyRole(User user, List<String> roleNames) {
        Set<Role> roles = user.getRoles();
        if (roleNames != null && roles != null) {
            for (Role role : roles) {
                if (roleNames.contains(role.getName())) {
                    return true;
                }
            }
        }
        return false;
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

    /**
     * Check if current user has access to type/id entity
     *
     * @param type
     * @param id
     *
     * @return true if current user has access to
     */
    private boolean hasPermission(String type, Long id) {
        if ("User".equals(type)) {
            User user = this.getCurrentUser();
            return id != null && id.equals(user.getId());
        } else if ("GameModel".equals(type)) {
            return SecurityUtils.getSubject().isPermitted("GameModel:View:gm" + id);
        } else if ("Game".equals(type)) {
            Game game = gameFacade.find(id);
            return game != null && SecurityHelper.isPermitted(game, "View");
        } else if ("Team".equals(type)) {

            Team team = teamFacade.find(id);
            User user = this.getCurrentUser();

            // Current logged User is linked to a player who's member of the team or current user has edit right one the game
            return team != null && (playerFacade.checkExistingPlayerInTeam(team.getId(), user.getId()) != null || SecurityHelper.isPermitted(team.getGame(), "Edit"));
        } else if ("Player".equals(type)) {
            User user = this.getCurrentUser();
            Player player = playerFacade.find(id);

            // Current player belongs to current user || current user is the teacher or scenarist (test user)
            return player != null && ((user != null && user.equals(player.getUser())) || SecurityHelper.isPermitted(player.getGame(), "Edit"));
        }
        return false;
    }

    /**
     * can current user subscribe to given channel ?
     *
     * @param channel
     *
     * @return true if access granted
     */
    public boolean hasPermission(String channel) {
        if (WebsocketFacade.ADMIN_CHANNEL.equals(channel)) {
            return SecurityUtils.getSubject().hasRole("Administrator");
        } else {
            Matcher matcher = WebsocketFacade.PRIVATE_CHANNEL_PATTERN.matcher(channel);
            return matcher.matches() && this.hasPermission(matcher.group(1), Long.parseLong(matcher.group(2), 10));
        }
    }

    /**
     * @return Looked-up EJB
     */
    public static UserFacade lookup() {
        try {
            return Helper.lookupBy(UserFacade.class);
        } catch (NamingException ex) {
            logger.error("Error retrieving user facade", ex);
            return null;
        }
    }

}
