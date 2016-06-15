/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.*;
import com.wegas.core.rest.util.Email;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.AuthenticationInformation;
import com.wegas.core.security.util.SecurityHelper;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.authz.AuthorizationException;
import org.apache.shiro.authz.UnauthorizedException;
import org.apache.shiro.authz.annotation.RequiresPermissions;
import org.apache.shiro.subject.SimplePrincipalCollection;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.mail.MessagingException;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import java.io.IOException;
import java.util.*;
import org.apache.shiro.authz.AuthorizationException;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("User")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserController {

    private final static Logger logger = LoggerFactory.getLogger(UserController.class);

    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    /**
     *
     */
    @EJB
    private RoleFacade roleFacade;

    /**
     *
     */
    @EJB
    private AccountFacade accountFacade;

    /**
     *
     */
    @EJB
    private GameFacade gameFacade;

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
     * @return list of all users, sorted by names
     * @throws AuthorizationException if current user doesn't have the permission to
     *                                see other users
     */
    @GET
    public Collection<User> index() {

        SecurityUtils.getSubject().checkPermission("User:Edit");

        //List<User> findAll = userFacade.findAll();
        List<User> findAll = new ArrayList<>();
        for (JpaAccount account : accountFacade.findAllRegistered()) {
            findAll.add(account.getUser());
        }

        Collections.sort(findAll);                                              // @fixme Manually sort not to use a query
        return findAll;
    }

    /**
     * Get a specific user
     *
     * @param entityId user id to look for
     * @return the user matching entityId
     * @throws AuthorizationException if searched users id not the current one
     *                                or current one doesn't have the
     *                                permissions to see others users
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    public User get(@PathParam("entityId") Long entityId) {
        if (!userFacade.getCurrentUser().getId().equals(entityId)) {
            SecurityUtils.getSubject().checkPermission("User:Edit");
        }

        return userFacade.find(entityId);
    }

    /**
     * Returns the given user's e-mail address, with more relaxed security requirements than for getting the whole user profile:
     * The caller must be trainer for the given game, and the given user must be a player of the same game.
     * @param entityId
     * @param gameId
     * @return
     */
/*
    @GET
    @Path("{entityId : [1-9][0-9]*}/Email/{gameId : [1-9][0-9]*}")
    public String getEmail(@PathParam("entityId") Long entityId, @PathParam("gameId") Long gameId) {
        if (!userFacade.getCurrentUser().getId().equals(entityId)) {
            // Caller must be trainer for the given game:
            final Game g = gameFacade.find(gameId);
            SecurityHelper.checkPermission(g, "Edit");
            // And user must be a player of the same game:
            if (playerFacade.checkExistingPlayer(gameId, entityId) == null) {
                throw new AuthorizationException("Not a player of this game");
            }
        }

        AbstractAccount mainAccount = userFacade.find(entityId).getMainAccount();

        if (mainAccount instanceof JpaAccount) {
            return ((JpaAccount) mainAccount).getEmail();
        } else {
            return "";
        }
    }
*/

    /**
     * Returns the e-mail addresses of all players of the given game,
     * with more relaxed security requirements than for getting the whole user profile:
     * The caller must be trainer for the given game.
     * @param gameId
     * @return
     */
    @GET
    @Path("Emails/{gameId : [1-9][0-9]*}")
    public List<String> getEmails(@PathParam("gameId") Long gameId) {
        // Caller must be trainer for the given game:
        final Game g = gameFacade.find(gameId);
        if (g instanceof DebugGame) return null;
        SecurityHelper.checkPermission(g, "Edit");

        List<String> emails = new ArrayList<String>();
        for (Team t: g.getTeams()) {
            emails.addAll(collectEmails(t));
        }
        return emails;
    }

    /**
     * Returns the e-mail addresses of all players of the given team,
     * with more relaxed security requirements than for getting the whole user profile:
     * The caller must be trainer for the given game and the team must belong to the same game.
     * @param gameId
     * @return
     */
    @GET
    @Path("Emails/{gameId : [1-9][0-9]*}/{teamId : [1-9][0-9]*}")
    public List<String> getEmails(@PathParam("gameId") Long gameId, @PathParam("teamId") Long teamId) {
        final Game g = gameFacade.find(gameId);
        final Team t = teamFacade.find(teamId);
        if (!t.getGame().getId().equals(gameId)) {
            throw new AuthorizationException("Not a team of this game");
        }
        if (g instanceof DebugGame) return null;
        // Caller must be trainer for the given game:
        SecurityHelper.checkPermission(g, "Edit");
        return collectEmails(t);
    }


    /**
     * @param team
     * @return List<String>
     */
    protected List<String> collectEmails(Team team){
        List<String> emails = new ArrayList<>();
        if (team instanceof DebugTeam) return emails;
        List<Player> players = team.getPlayers();
        if (players.size()==0) return emails;
        for (Player p: players) {
            if (p.getName().equals("Guest")){
                emails.add("Guest");
            } else {
                Long userId = p.getUserId();
                AbstractAccount mainAccount = userFacade.find(userId).getMainAccount();
                if (mainAccount instanceof JpaAccount) { // Skip guest accounts and other specialties.
                    emails.add(((JpaAccount) mainAccount).getEmail());
                }
            }
        }
        return emails;
    }

    /**
     * @param value
     * @return
     * Look for jpaAccounts matching given value.
     *
     * The value can be part of the first name, last name, email or username.
     * Case insensitive.
     *
     * @param value search token
     * @return list of JpaAccount matching the token
     */
    @GET
    @Path("AutoComplete/{value}")
    public List<JpaAccount> getAutoComplete(@PathParam("value") String value) {
        return accountFacade.getAutoComplete(value);
    }

    /**
     * Return accounts that match given "value" (like
     * {@link #getAutoComplete(java.lang.String) getAutoComplete()} but are not
     * yet member of the given game.
     *
     * Returned Account will also have their email altered so they can be
     * displayed to anybody (from user@tada.ch to use*****@tada.ch)
     *
     * @param value  token to search
     * @param gameId id of the game targeted account cannot be already
     *               registered in
     *
     * @return list of account matching given search value which are not yet
     *         member of the given game
     */
    @GET
    @Path("AutoCompleteFull/{value}/{gameId : [1-9][0-9]*}")
    public List<JpaAccount> getAutoCompleteFull(@PathParam("value") String value, @PathParam("gameId") Long gameId) {
        return accountFacade.getAutoCompleteFull(value, gameId);
    }

    /**
     * Same as {@link #getAutoComplete(java.lang.String) getAutoComplete} but
     * account must be member of (at least) one role in rolesList
     *
     * @param value     account search token
     * @param rolesList list of roles targeted account should be members (only
     *                  one membership is sufficient)
     * @return list of JpaAccount matching the token that are member of at least
     *         one given role
     */
    @POST
    @Path("AutoComplete/{value}")
    public List<JpaAccount> getAutoCompleteByRoles(@PathParam("value") String value, HashMap<String, List<String>> rolesList) {
        if (!SecurityUtils.getSubject().isRemembered() && !SecurityUtils.getSubject().isAuthenticated()) {
            throw new UnauthorizedException();
        }
        return accountFacade.getAutoCompleteByRoles(value, rolesList);
    }

    /**
     * @param values
     * @return dunno
     * @deprecated
     */
    @GET
    @Deprecated
    @Path("FindAccountsByEmailValues")
    public List<Map> findAccountsByEmailValues(@QueryParam("values") List<String> values) {
        return accountFacade.findAccountsByEmailValues(values);
    }

    /**
     * @param values
     * @deprecated
     * @return dunno
     */
    @GET
    @Deprecated
    @Path("FindAccountsByName")
    public List<JpaAccount> findAccountsByName(@QueryParam("values") List<String> values) {
        if (!SecurityUtils.getSubject().isRemembered() && !SecurityUtils.getSubject().isAuthenticated()) {
            throw new UnauthorizedException();
        }
        return accountFacade.findAccountsByName(values);
    }

    /**
     * Create a new user
     *
     * @param user new user to save
     * @return the new user
     * @throws AuthorizationException if the current user doesn't have the
     *                                permission to create users
     */
    @POST
    public User create(User user) {
        SecurityUtils.getSubject().checkPermission("User:Edit");

        userFacade.create(user);
        return user;
    }

    /**
     * Update a user
     *
     * @param entityId id of user to update
     * @param entity   user to read new values from
     * @return the updated user
     * @throws AuthorizationException if current user is not the updated user or
     *                                if the current user doesn't have the
     *                                permission to edit others users
     */
    @PUT
    @Path("{entityId: [1-9][0-9]*}")
    public User update(@PathParam("entityId") Long entityId, User entity) {

        if (!userFacade.getCurrentUser().getId().equals(entityId)) {
            SecurityUtils.getSubject().checkPermission("User:Edit");
        }

        return userFacade.update(entityId, entity);
    }

    /**
     * Delete a user by account id (why not by user id ???)
     *
     * @param accountId id of account linked to the user to delete
     * @return the user that has been deleted
     * @throws AuthorizationException currentUser does not have the permission
     *                                to delete users
     */
    @DELETE
    @Path("{accountId: [1-9][0-9]*}")
    public User delete(@PathParam("accountId") Long accountId) {
        AbstractAccount a = accountFacade.find(accountId);
        User user = a.getUser();
        if (!userFacade.getCurrentUser().equals(a.getUser())) {
            SecurityUtils.getSubject().checkPermission("User:Edit");
        }

        accountFacade.remove(a);
        userFacade.remove(user);
        return user;
        //return user;
        //User u = userFacade.find(entityId);
        //
        //if (!userFacade.getCurrentUser().equals(u)) {
        //    SecurityUtils.getSubject().checkPermission("User:Edit");
        //}
        //userFacade.remove(entityId);
        //return u;
    }

    /**
     * Allows to login using a post request
     *
     * @param authInfo
     * @param request
     * @param response
     * @return User the current user
     * @throws WegasErrorMessage when authInfo values are incorrect
     * @throws ServletException
     * @throws IOException
     */
    @POST
    @Path("Authenticate")
    public User login(AuthenticationInformation authInfo,
            @Context HttpServletRequest request,
            @Context HttpServletResponse response) throws ServletException, IOException {

        Subject subject = SecurityUtils.getSubject();

        User guest = null;
        if (subject.isAuthenticated()) {
            AbstractAccount gAccount = accountFacade.find((Long) subject.getPrincipal());
            if (gAccount instanceof GuestJpaAccount) {
                logger.error("Logged as guest");
                guest = gAccount.getUser();
                subject.logout();
            }
        }

        //if (!currentUser.isAuthenticated()) {
        UsernamePasswordToken token = new UsernamePasswordToken(authInfo.getLogin(), authInfo.getPassword());
        token.setRememberMe(authInfo.isRemember());
        try {
            subject.login(token);
            if (authInfo.getAgreed()){
                AbstractAccount account = accountFacade.find((Long) subject.getPrincipal());
                if (account instanceof JpaAccount) {
                    ((JpaAccount)account).setAgreedTime(new Date());
                }
            }

            User user = userFacade.getCurrentUser();

            if (guest != null) {
                userFacade.transferPlayers(guest, user);
            }
            return user;
        } catch (AuthenticationException aex) {
            throw WegasErrorMessage.error("Email/password combination not found");
        }
    }

    /**
     * Logout
     *
     * @return 200 OK
     */
    @GET
    @Path("Logout")
    public Response logout() {
        userFacade.logout();
        return Response.status(Response.Status.OK).build();
    }

    /**
     * Automatic guest login
     *
     * @param authInfo
     */
    @POST
    @Path("GuestLogin")
    public void guestLogin(AuthenticationInformation authInfo) {
        userFacade.guestLogin();
    }

    /**
     * Automatic quest login with scenarist rights
     *
     * @param authInfo
     */
    @POST
    @Path("TeacherGuestLogin")
    @Deprecated
    public void teacherGuestLogin(AuthenticationInformation authInfo) {
        User user = userFacade.guestLogin();
        try {
            user.addRole(roleFacade.findByName("Scenarist"));
        } catch (WegasNoResultException ex) {
            throw WegasErrorMessage.error("Teacher mode is not available");
        }
    }

    /**
     * Is anybody there ?
     *
     * @return true if request initiator is logged in
     */
    @GET
    @Path("LoggedIn")
    public boolean isLoggedIn() {
        return SecurityUtils.getSubject().isRemembered() || SecurityUtils.getSubject().isAuthenticated();
    }

    /**
     * See like an other user specified by it's jpaAccount id. Administrators
     * only.
     *
     * @param accountId jpaAccount id
     * @throws AuthorizationException if current user is not an administrator
     */
    @POST
    @Path("Be/{accountId: [1-9][0-9]*}")
    public void runAs(@PathParam("accountId") Long accountId) {
        Subject oSubject = SecurityUtils.getSubject();

        if (oSubject.isRunAs()) {
            oSubject.releaseRunAs(); //@TODO: check shiro version > 1.2.1 (SHIRO-380)
        }
        oSubject.checkRole("Administrator");
        SimplePrincipalCollection subject = new SimplePrincipalCollection(accountId, "jpaRealm");
        oSubject.runAs(subject);
    }

    /**
     * @param username
     * @param password
     * @param firstname
     * @param lastname
     * @param email
     * @param request
     */
    @POST
    @Path("Signup")
    @Deprecated
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public void signup(@FormParam("username") String username,
            @FormParam("password") String password,
            @FormParam("firstname") String firstname,
            @FormParam("lastname") String lastname,
            @FormParam("email") String email,
            @Context HttpServletRequest request) {
        JpaAccount account = new JpaAccount();                                   // Convert post params to entity
        account.setUsername(username);
        account.setPassword(password);
        account.setFirstname(firstname);
        account.setLastname(lastname);
        account.setEmail(email);
        this.signup(account, request);                                                   // and forward
    }

    /**
     * Create a user based with a JpAAccount
     *
     * @param account
     * @param request
     * @return Response : Status Not acceptable if email is wrong or username
     *         already exist. Created otherwise.
     */
    @POST
    @Path("Signup")
    public Response signup(JpaAccount account,
            @Context HttpServletRequest request) {
        Response r;
        if (this.checkEmailString(account.getEmail())) {
            if (account.getUsername().equals("") || !this.checkExistingUsername(account.getUsername())) {
                User user;
                Subject subject = SecurityUtils.getSubject();

                if (subject.isAuthenticated() && accountFacade.find((Long) subject.getPrincipal()) instanceof GuestJpaAccount) {
                    GuestJpaAccount from = (GuestJpaAccount) accountFacade.find((Long) subject.getPrincipal());
                    subject.logout();
                    userFacade.upgradeGuest(from, account);
                    r = Response.status(Response.Status.CREATED).build();
                } else {
                    // Check if e-mail is already taken and if yes return a localized error message:
                    try {
                        accountFacade.findByEmail(account.getEmail());
                        String msg = detectBrowserLocale(request).equals("fr") ? "Cette adresse e-mail est déjà prise." : "This email address is already taken.";
                        r = Response.status(Response.Status.BAD_REQUEST).entity(WegasErrorMessage.error(msg)).build();
                    } catch (WegasNoResultException e) {
                        // GOTCHA
                        // E-Mail not yet registered -> proceed with account creation
                        user = new User(account);
                        userFacade.create(user);
                        r = Response.status(Response.Status.CREATED).build();
                    }
                }
            } else {
                String msg = detectBrowserLocale(request).equals("fr") ? "Ce nom d'utilisateur est déjà pris." : "This username is already taken.";
                r = Response.status(Response.Status.BAD_REQUEST).entity(WegasErrorMessage.error(msg)).build();
            }
        } else {
            String msg = detectBrowserLocale(request).equals("fr") ? "Cette adresse e-mail n'est pas valide." : "This e-mail address is not valid.";
            r = Response.status(Response.Status.BAD_REQUEST).entity(WegasErrorMessage.error(msg)).build();
        }
        return r;
    }

    /**
     * @param authInfo
     * @param request
     */
    @POST
    @Path("SendNewPassword")
    public void sendNewPassword(AuthenticationInformation authInfo,
            @Context HttpServletRequest request) {
        userFacade.sendNewPassword(authInfo.getLogin());
    }

    /**
     *
     * @param email
     */
    @POST
    @Path("SendMail")
    public void sendMail(Email email) {
        // TODO Check persmissions !!!
        // Current User should have each recipients registered in a game he leads or be such a superuser

        AbstractAccount mainAccount = userFacade.getCurrentUser().getMainAccount();
        String name = mainAccount.getName();
        if (name.length() == 0) {
            name = "anonymous";
        }

        if (mainAccount instanceof JpaAccount) {
            email.setReplyTo(((JpaAccount) mainAccount).getEmail());
        }

        String body = email.getBody();
        body += "<br /><br /><hr /><i> Sent by " + name + " from " + "albasim.ch</i>";
        email.setBody(body);

        email.setFrom(name + " via Wegas <noreply@" + Helper.getWegasProperty("mail.default_domain") + ">");

        userFacade.sendEmail(email);
    }

    /**
     * Get all roles which have some permissions on the given instance..
     *
     * Map is { id : role id, name: role name, permissions: list of permissions
     * related to instance}
     *
     * deprecated ?
     *
     * @param instance
     * @return list of "Role"
     * @throws AuthorizationException when current user doesn't have edit
     *                                permission on given instance
     */
    @GET
    @Path("FindPermissionByInstance/{instance}")
    public List<Map> findPermissionByInstance(@PathParam(value = "instance") String instance) {

        checkGmOrGPermission(instance, "GameModel:Edit:", "Game:Edit:");

        return this.userFacade.findRolePermissionByInstance(instance);
    }

    /**
     * Get the current user, error 400 if there is no user logged.
     *
     * @return user, the current user;
     */
    @GET
    @Path("Current")
    public User getCurrentUser() {
        return userFacade.getCurrentUser();
    }

    /**
     * Find all teams for the current user.
     *
     * @return teamsToReturn, the collection of teams where the current user is
     *         a player.
     */
    @GET
    @Path("Current/Team")
    public Response findTeamsByCurrentUser() {
        Response r = Response.noContent().build();
        Collection<Team> teamsToReturn = new ArrayList<>();
        User currentUser = userFacade.getCurrentUser();
        final List<Player> players = currentUser.getPlayers();
        for (Player p : players) {
            teamsToReturn.add(p.getTeam());
        }
        if (!teamsToReturn.isEmpty()) {
            r = Response.ok().entity(teamsToReturn).build();
        }

        return r;
    }

    /**
     * Find a team for the current user.
     *
     * @param teamId the id of the team joined by the current user.
     * @return Response, No Content if no team found, the team otherwise
     */
    @GET
    @Path("Current/Team/{teamId}")
    public Response getTeamByCurrentUser(@PathParam("teamId") Long teamId) {
        Response r = Response.noContent().build();
        User currentUser = userFacade.getCurrentUser();
        final Collection<Game> playedGames = gameFacade.findRegisteredGames(currentUser.getId());
        for (Game g : playedGames) {
            Collection<Team> teams = g.getTeams();
            for (Team t : teams) {
                if (teamId.equals(t.getId())) {
                    for (Player p : t.getPlayers()) {
                        if (p.getUserId().equals(currentUser.getId())) {
                            r = Response.ok().entity(t).build();
                        }
                    }
                }
            }
        }
        return r;
    }

    /**
     * Delete permission by role and permission
     *
     * @param roleId
     * @param permission
     * @return true a permission has been removed
     */
    @POST
    @Path("DeletePermission/{roleId : [1-9][0-9]*}/{permission}")
    public boolean deletePermissionByInstance(@PathParam(value = "roleId") Long roleId, @PathParam(value = "permission") String permission) {

        String splitedPermission[] = permission.split(":");

        checkGmOrGPermission(splitedPermission[2], "GameModel:Edit:", "Game:Edit:");

        return this.userFacade.deleteRolePermission(roleId, permission);
    }

    /**
     * Create role_permissions
     *
     * @param roleId
     * @param permission
     * @return true if permission has been created
     */
    @POST
    @Path("AddPermission/{roleId : [1-9][0-9]*}/{permission}")
    public boolean addPermissionsByInstance(@PathParam(value = "roleId") Long roleId, @PathParam(value = "permission") String permission) {

        String splitedPermission[] = permission.split(":");

        checkGmOrGPermission(splitedPermission[2], "GameModel:Edit:", "Game:Edit:");

        return this.userFacade.addRolePermission(roleId, permission);
    }

    /**
     * @param roleName
     * @param permission
     * @return true if permission has been created
     */
    @POST
    @Path("AddPermission/{roleName}/{permission}")
    public boolean addPermissionsByInstance(@PathParam(value = "roleName") String roleName, @PathParam(value = "permission") String permission) {
        try {
            return this.addPermissionsByInstance(roleFacade.findByName(roleName).getId(), permission);
        } catch (WegasNoResultException ex) {
            throw WegasErrorMessage.error("Role \"" + roleName + "\" does not exists");
        }
    }

    /**
     * Delete all permission from a role in a Game or GameModel
     *
     * @param roleId
     * @param id
     * @return if permissions have been removed
     */
    @POST
    @Path("DeleteAllRolePermissions/{roleId : [1-9][0-9]*}/{gameModelId}")
    public boolean deleteAllRolePermissions(@PathParam("roleId") Long roleId,
            @PathParam("gameModelId") String id) {

        checkGmOrGPermission(id, "GameModel:Edit:", "Game:Edit:");

        return this.userFacade.deleteRolePermissionsByIdAndInstance(roleId, id);
    }

    /**
     * Delete all role permission related to gameModel identified by the given
     * id
     *
     * @param roleName name of the role to remove permissions from
     * @param id       id of the gameModel
     * @return if permissions have been removed
     */
    @POST
    @Path("DeleteAllRolePermissions/{roleName}/{gameModelId}")
    public boolean deleteAllRolePermissions(@PathParam("roleName") String roleName,
            @PathParam("gameModelId") String id) {
        try {
            return this.deleteAllRolePermissions(roleFacade.findByName(roleName).getId(), id);
        } catch (WegasNoResultException ex) {
            throw WegasErrorMessage.error("Role \"" + roleName + "\" does not exists");
        }
    }

    /**
     * @param entityId
     * @return all users having any permissions related to game or gameModel
     *         identified by entityId
     */
    @GET
    @Path("FindUserPermissionByInstance/{entityId}")
    public List<User> findUserPermissionByInstance(@PathParam("entityId") String entityId) {

        checkGmOrGPermission(entityId, "GameModel:Edit:", "Game:Edit:");

        return userFacade.findUserPermissionByInstance(entityId);
    }

    /**
     * Get role members
     *
     * @param roleId
     * @return all members with the given role
     */
    @GET
    @Path("FindUsersWithRole/{role_id}")
    @RequiresPermissions("User:Edit")
    public List<User> findUsersWithRole(@PathParam("role_id") Long roleId) {
        return userFacade.findUsersWithRole(roleId);
    }

    /**
     * @param permission
     * @param accountId
     */
    @POST
    @Path("addAccountPermission/{permission}/{accountId : [1-9][0-9]*}")
    public void addAccountPermission(@PathParam("permission") String permission,
            @PathParam("accountId") Long accountId) {

        String splitedPermission[] = permission.split(":");

        checkGmOrGPermission(splitedPermission[2], "GameModel:Edit:", "Game:Edit:");

        userFacade.addAccountPermission(accountId, permission);
    }

    /**
     * @param entityId
     * @param accountId
     */
    @DELETE
    @Path("DeleteAccountPermissionByInstanceAndAccount/{entityId}/{accountId : [1-9][0-9]*}")
    public void deleteAccountPermissionByInstanceAndAccount(@PathParam("entityId") String entityId,
            @PathParam("accountId") Long accountId) {

        checkGmOrGPermission(entityId, "GameModel:Edit:", "Game:Edit:");
        AbstractAccount account = accountFacade.find(accountId);

        userFacade.deleteUserPermissionByInstanceAndUser(entityId, account.getUser().getId());
    }

    /**
     * @param permission
     * @param accountId
     */
    @DELETE
    @Path("DeleteAccountPermissionByPermissionAndAccount/{permission}/{accountId : [1-9][0-9]*}")
    public void deleteAccountPermissionByPermissionAndAccount(@PathParam("permission") String permission,
            @PathParam("accountId") Long accountId) {

        String splitedPermission[] = permission.split(":");

        checkGmOrGPermission(splitedPermission[2], "GameModel:Edit:", "Game:Edit:");
        AbstractAccount account = accountFacade.find(accountId);

        userFacade.deleteUserPermissionByPermissionAndAccount(permission, account.getUser().getId());
    }

    /**
     *
     * @param entityId
     * @param gmPermission
     * @param gPermission
     */
    private void checkGmOrGPermission(String entityId, String gmPermission, String gPermission) {
        if (entityId.substring(0, 2).equals("gm")) {
            SecurityUtils.getSubject().checkPermission(gmPermission + entityId);
        } else {
            SecurityUtils.getSubject().checkPermission(gPermission + entityId);
        }
    }

    /**
     * Check if email is valid. (Only a string test)
     *
     * @param email
     * @return true if given address is valid
     */
    private boolean checkEmailString(String email) {
        boolean validEmail = true;
        try {
            InternetAddress emailAddr = new InternetAddress(email);
            emailAddr.validate();
        } catch (AddressException ex) {
            validEmail = false;
        }
        return validEmail;
    }

    /**
     * Check is username is already in use
     *
     * @param username username to check
     * @return true is username is already in use
     */
    private boolean checkExistingUsername(String username) {
        boolean existingUsername = false;
        User user = userFacade.getUserByUsername(username);
        if (user != null) {
            existingUsername = true;
        }
        return existingUsername;
    }

    /*
    ** @return the browser's preference among the languages supported by Wegas
     */
    private String detectBrowserLocale(HttpServletRequest request) {
        String supportedLanguages = "en fr";

        Enumeration locales = request.getLocales();
        while (locales.hasMoreElements()) {
            Locale locale = (Locale) locales.nextElement();
            String loc = locale.getLanguage();
            if (supportedLanguages.contains(loc)) {
                return loc;
            }
        }
        // No match found, return the default "en":
        return "en";
    }

}
