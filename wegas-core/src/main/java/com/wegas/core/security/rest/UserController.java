/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.Helper;
import com.wegas.core.async.PopulatorFacade;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.PlayerFacade;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.DatedEntity;
import com.wegas.core.persistence.game.*;
import com.wegas.core.rest.util.Email;
import com.wegas.core.security.aai.*;
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
import javax.inject.Inject;
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

    @Inject
    private PopulatorFacade populatorFacade;

    /**
     * @return list of all users, sorted by names
     *
     * @throws AuthorizationException if current user doesn't have the
     *                                permission to see other users
     */
    @GET
    public Collection<User> index() {
        SecurityUtils.getSubject().checkPermission("User:Edit");

        //List<User> findAll = userFacade.findAll();
        List<User> findAll = new ArrayList<>();
        for (AbstractAccount account : accountFacade.findAllRegistered()) {
            findAll.add(account.getUser());
        }

        Collections.sort(findAll);                                              // @fixme Manually sort not to use a query
        return findAll;
    }

    /**
     * Get a specific user
     *
     * @param entityId user id to look for
     *
     * @return the user matching entityId
     *
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
     * Returns the e-mail addresses of all players of the given game, with more
     * relaxed security requirements than for getting the whole user profile:
     * The caller must be trainer for the given game.
     *
     * @param gameId
     *
     * @return
     */
    @GET
    @Path("Emails/{gameId : [1-9][0-9]*}")
    public List<String> getEmails(@PathParam("gameId") Long gameId) {
        // Caller must be trainer for the given game:
        final Game g = gameFacade.find(gameId);
        if (g instanceof DebugGame) {
            return null;
        }
        SecurityHelper.checkPermission(g, "Edit");

        List<String> emails = new ArrayList<String>();
        for (Team t : g.getTeams()) {
            emails.addAll(collectEmails(t));
        }
        return emails;
    }

    /**
     * Returns the e-mail addresses of all players of the given team, with more
     * relaxed security requirements than for getting the whole user profile:
     * The caller must be trainer for the given game and the team must belong to
     * the same game.
     *
     * @param gameId
     *
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
        if (g instanceof DebugGame) {
            return null;
        }
        // Caller must be trainer for the given game:
        SecurityHelper.checkPermission(g, "Edit");
        return collectEmails(t);
    }

    /**
     * @param team
     *
     * @return List<String>
     */
    protected List<String> collectEmails(Team team) {
        List<String> emails = new ArrayList<>();
        if (team instanceof DebugTeam) {
            return emails;
        }
        List<Player> players = team.getPlayers();
        if (players.size() == 0) {
            return emails;
        }
        for (Player p : players) {
            if (p.getName().equals("Guest")) {
                emails.add("Guest");
            } else {
                Long userId = p.getUserId();
                AbstractAccount mainAccount = userFacade.find(userId).getMainAccount();
                if (mainAccount instanceof JpaAccount || mainAccount instanceof AaiAccount) { // Skip guest accounts and other specialties.
                    emails.add(mainAccount.getEmail());
                }
            }
        }
        return emails;
    }

    /**
     * @param value
     *
     * @return list of AbstractAccounts (excluding guests) matching the token
     */
    @GET
    @Path("AutoComplete/{value}")
    public List<AbstractAccount> getAutoComplete(@PathParam("value") String value) {
        return accountFacade.getAutoComplete(value);
    }

    /**
     * Return accounts that match given "value" (like
     * {@link #getAutoComplete(java.lang.String) getAutoComplete()} but are not
     * yet member of the given game.
     * <p>
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
    public List<AbstractAccount> getAutoCompleteFull(@PathParam("value") String value, @PathParam("gameId") Long gameId) {
        return accountFacade.getAutoCompleteFull(value, gameId);
    }

    /**
     * Same as {@link #getAutoComplete(java.lang.String) getAutoComplete} but
     * account must be member of (at least) one role in rolesList
     *
     * @param value     account search token
     * @param rolesList list of roles targeted account should be members (only
     *                  one membership is sufficient)
     *
     * @return list of AbstractAccount matching the token that are member of at least
     *         one given role
     */
    @POST
    @Path("AutoComplete/{value}")
    public List<AbstractAccount> getAutoCompleteByRoles(@PathParam("value") String value, HashMap<String, List<String>> rolesList) {
        if (!SecurityUtils.getSubject().isRemembered() && !SecurityUtils.getSubject().isAuthenticated()) {
            throw new UnauthorizedException();
        }
        return accountFacade.getAutoCompleteByRoles(value, rolesList);
    }

    /**
     * @param values
     *
     * @return dunno
     *
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
     *
     * @return dunno
     *
     * @deprecated
     */
    @GET
    @Deprecated
    @Path("FindAccountsByName")
    public List<AbstractAccount> findAccountsByName(@QueryParam("values") List<String> values) {
        if (!SecurityUtils.getSubject().isRemembered() && !SecurityUtils.getSubject().isAuthenticated()) {
            throw new UnauthorizedException();
        }
        return accountFacade.findAccountsByName(values);
    }

    /**
     * Create a new user
     *
     * @param user new user to save
     *
     * @return the new user
     *
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
     *
     * @return the updated user
     *
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
     *
     * @return the user that has been deleted
     *
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
     *
     * @return User the current user
     *
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
            if (authInfo.isAgreed()) {
                AbstractAccount account = accountFacade.find((Long) subject.getPrincipal());
                if (account instanceof JpaAccount) {
                    account.setAgreedTime(new Date());
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
     * Look like an other user specified by its Account id. Administrators only.
     *
     * @param accountId AbstractAccount id
     *
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
        SimplePrincipalCollection subject = new SimplePrincipalCollection(accountId, "jpaRealm"); // NB: this also seems to work with AaiAccounts ...
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
     * Create a user based on a JpaAccount
     *
     * @param account
     * @param request
     *
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
                        // Do NOT restrict checking to JpaAccounts (this is to prevent any collisions):
                        accountFacade.findByEmail(account.getEmail());
                        r = Response.status(Response.Status.BAD_REQUEST).entity(WegasErrorMessage
                                .error("This email address is already taken", "CREATE-ACCOUNT-TAKEN-EMAIL")).build();
                    } catch (WegasNoResultException e) {
                        // GOTCHA
                        // E-Mail not yet registered -> proceed with account creation
                        if (account.getAgreedTime() != null) {
                            account.setAgreedTime(new Date());
                        }
                        user = new User(account);
                        userFacade.create(user);
                        r = Response.status(Response.Status.CREATED).build();
                    }
                }
            } else {
                r = Response.status(Response.Status.BAD_REQUEST)
                        .entity(WegasErrorMessage.error("This username is already taken", "CREATE-ACCOUNT-TAKEN-USERNAME")).build();
            }
        } else {
            r = Response.status(Response.Status.BAD_REQUEST)
                    .entity(WegasErrorMessage.error("This e-mail address is not valid", "CREATE-ACCOUNT-INVALID-EMAIL")).build();
        }
        return r;
    }

    /**
     * Create a user based on an AaiAccount
     *
     * @param account
     * @param request
     *
     * @return void
     */
    public void create(AaiAccount account,
            @Context HttpServletRequest request) {
        if (!this.checkExistingPersistentId(account.getPersistentId())) {
            User user = new User(account);
            userFacade.create(user);
        } else {
            logger.error("This AAI account is already registered.");
        }
    }

    /**
     * Logs in an AAI-authenticated user or creates a new account for him.
     *
     * @return AaiLoginResponse telling e.g. if the user is new.
     *         Session cookies for the user's browser are also returned.
     *
     * @param userDetails
     */
    @POST
    @Path("AaiLogin")
    public AaiLoginResponse aaiLogin(AaiUserDetails userDetails,
            @Context HttpServletRequest request,
            @Context HttpServletResponse response) throws ServletException, IOException {

        // Check if the invocation is by HTTPS. @TODO: verify certificate.
        if (!request.isSecure()) {
            return new AaiLoginResponse("AAI login request must be made by HTTPS", false, false);
        }

        if (!AaiConfigInfo.isAaiEnabled()) {
            logger.error("AAI login refused because it's configured to be inactive.");
            return new AaiLoginResponse("Sorry, AAI login is currently not possible.", false, false);
        }

        String server = AaiConfigInfo.getAaiServer(); // Ignored if empty !
        String secret = AaiConfigInfo.getAaiSecret(); // Ignored if empty !
        if (server.length() != 0 && !getRequestingIP(request).equals(server)
                || secret.length() != 0 && !userDetails.getSecret().equals(secret)) {
            logger.error("Real secret: " + userDetails.getSecret() + ", expected: " + secret);
            logger.error("Real remote host: " + getRequestingIP(request) + ", expected: " + server);
            Enumeration<String> headerNames = request.getHeaderNames();
            if (headerNames != null) {
                while (headerNames.hasMoreElements()) {
                    String hdr = headerNames.nextElement();
                    logger.error("    HTTP header: " + hdr + ":" + request.getHeader(hdr));
                }
            }
            return new AaiLoginResponse("Could not authenticate Wegas AAI server", false, false);
        }
        // Get rid of shared secret:
        userDetails.setSecret("checked");

        // It should not be possible for the caller (our AAI login server) to be already logged in...
        Subject subject = SecurityUtils.getSubject();
        if (subject.isAuthenticated()) {
            subject.logout();
            throw WegasErrorMessage.error("Logging out an already logged in user (internal error?)");
        }

        try {
            Long accountId = (Long) subject.getPrincipal();
            AaiToken token = new AaiToken(accountId, userDetails);
            token.setRememberMe(userDetails.isRememberMe());
            subject.login(token);
            accountFacade.refreshAaiAccount(userDetails);
            return new AaiLoginResponse("Login successful", true, false);
        } catch (AuthenticationException aex) {
            logger.error("User not found, creating new account.");
            AaiAccount account = new AaiAccount(userDetails);
            this.create(account, request);
            // Try to log in the new user:
            try {
                AaiToken token = new AaiToken((Long) account.getId(), userDetails);
                token.setRememberMe(userDetails.isRememberMe());
                subject.login(token);
            } catch (AuthenticationException aex2) {
                return new AaiLoginResponse("New account created, could not login to it", false, true);
            }
            return new AaiLoginResponse("New account created, login successful", true, true);
        }
    }

    /**
     * Returns the IP address of the requesting host by looking first at headers provided by (reverse) proxies.
     * Depending on local config, it may be necessary to check additional headers.
     *
     * @param request
     *
     * @return the IP address
     */
    public String getRequestingIP(HttpServletRequest request) {
        String ip = request.getHeader("X-FORWARDED-FOR");
        if (ip == null) {
            ip = request.getHeader("X-Real-IP");
            if (ip == null) {
                ip = request.getRemoteAddr();
            }
        }
        return ip;
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

        if (mainAccount instanceof JpaAccount || mainAccount instanceof AaiAccount) {
            email.setReplyTo(mainAccount.getEmail());
        }

        String body = "<!DOCTYPE html><html><head></head><body>" +
                email.getBody();
        body += "<br /><br /><hr /><i> Sent by " + name + " from albasim.ch</i></body></html>";
        email.setBody(body);

        email.setFrom(name + " via Wegas <noreply@" + Helper.getWegasProperty("mail.default_domain") + ">");

        userFacade.sendEmail(email);
    }

    /**
     * Get all roles which have some permissions on the given instance..
     * <p>
     * Map is { id : role id, name: role name, permissions: list of permissions
     * related to instance}
     * <p>
     * deprecated ?
     *
     * @param instance
     *
     * @return list of "Role"
     *
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

        List<DatedEntity> queue = populatorFacade.getQueue();

        for (Player p : players) {
            if (p.getStatus().equals(Populatable.Status.WAITING)
                    || p.getStatus().equals(Populatable.Status.RESCHEDULED)) {
                p.setQueueSize(queue.indexOf(p) + 1);
            }
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
     *
     * @return Response, No Content if no team found, the team otherwise
     */
    @GET
    @Path("Current/Team/{teamId}")
    public Response getTeamByCurrentUser(@PathParam("teamId") Long teamId) {
        Response r = Response.noContent().build();
        User currentUser = userFacade.getCurrentUser();
        final Collection<Game> playedGames = gameFacade.findRegisteredGames(currentUser.getId());
        for (Game g : playedGames) {
            for (Team t : g.getTeams()) {
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
     * @param entityId
     *
     * @return all users having any permissions related to game or gameModel
     *         identified by entityId
     */
    @GET
    @Path("FindUserPermissionByInstance/{entityId}")
    public List<User> findUserPermissionByInstance(@PathParam("entityId") String entityId) {

        checkGmOrGPermission(entityId, "GameModel:Edit:", "Game:Edit:");

        return userFacade.findUserByPermissionInstance(entityId);
    }

    /**
     * @param entityId
     *
     * @return all users having any permissions related to game or gameModel
     *         identified by entityId
     */
    @GET
    @Path("FindEditorsByInstance/{entityId}")
    public List<User> findEditorsByInstance(@PathParam("entityId") String entityId) {
        checkGmOrGPermission(entityId, "GameModel:Edit:", "Game:Edit:");
        return userFacade.findEditors(entityId);
    }

    /**
     * Get role members
     *
     * @param roleId
     *
     * @return all members with the given role
     */
    @GET
    @Path("FindUsersWithRole/{role_id}")
    @RequiresPermissions("User:Edit")
    public List<User> findUsersWithRole(@PathParam("role_id") Long roleId) {
        return userFacade.findUsersWithRole(roleId);
    }

    @POST
    @Path("ShareGame/{gameId : [1-9][0-9]*}/{accountId : [1-9][0-9]*}")
    public void shareGame(@PathParam("gameId") Long gameId,
            @PathParam("accountId") Long accountId) {

        User coTrainer = accountFacade.find(accountId).getUser();
        //TODO assert coTrainer is a Trainer...

        String thePermission = "Game:Edit:g" + gameId;
        // Assert current user has edit right on the game
        SecurityUtils.getSubject().checkPermission(thePermission);

        userFacade.addTrainerToGame(coTrainer.getId(), gameId);
    }

    @DELETE
    @Path("ShareGame/{gameId : [1-9][0-9]*}/{accountId : [1-9][0-9]*}")
    public void unshareGame(@PathParam("gameId") Long gameId,
            @PathParam("accountId") Long accountId) {

        User coTrainer = accountFacade.find(accountId).getUser();

        String thePermission = "Game:Edit:g" + gameId;
        // Assert current user has edit right on the game
        SecurityUtils.getSubject().checkPermission(thePermission);
        userFacade.removeTrainer(gameId, coTrainer); // TODO
    }

    /**
     * Grant given permission to the given user to the specified gameModel.
     * Previous user permissions to gameModel will be revoked
     *
     * @param gameModelId
     * @param permission  (View|Edit|Delete|Duplicate|Instantiate), comma
     *                    separated
     * @param accountId   user accountId
     */
    @POST
    @Path("ShareGameModel/{gameModelId : [1-9][0-9]*}/{permission: (View|Edit|Delete|Duplicate|Instantiate|,)*}/{accountId : [1-9][0-9]*}")
    public void shareGameModel(@PathParam("gameModelId") Long gameModelId,
            @PathParam("permission") String permission,
            @PathParam("accountId") Long accountId) {

        User user = accountFacade.find(accountId).getUser();

        String editPermission = "GameModel:Edit:gm" + gameModelId;

        // Assert current user has edit right on the gameModel
        SecurityUtils.getSubject().checkPermission(editPermission);

        userFacade.grantGameModelPermissionToUser(user.getId(), gameModelId, permission);
    }

    @DELETE
    @Path("ShareGameModel/{gameModelId : [1-9][0-9]*}/{accountId : [1-9][0-9]*}")
    public void unshareGameModel(@PathParam("gameModelId") Long gameModelId,
            @PathParam("accountId") Long accountId) {

        User coScenarist = accountFacade.find(accountId).getUser();

        String editPermission = "GameModel:Edit:gm" + gameModelId;

        // Assert current user has edit right on the gameModel
        SecurityUtils.getSubject().checkPermission(editPermission);
        userFacade.removeScenarist(gameModelId, coScenarist);
    }

    /**
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
     *
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
     * Check if username is already in use
     *
     * @param username username to check
     *
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

    /**
     * Check if persistent ID is already in use
     *
     * @param persistentId to check
     *
     * @return true is persistentId is already in use
     */
    private boolean checkExistingPersistentId(String persistentId) {
        boolean existingId = false;
        User user = userFacade.getUserByPersistentId(persistentId);
        if (user != null) {
            existingId = true;
        }
        return existingId;
    }

}
