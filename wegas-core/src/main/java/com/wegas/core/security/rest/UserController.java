/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.ejb.GameFacade;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.GameAccountKey;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.GameAccount;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.AuthenticationInformation;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.mail.internet.AddressException;
import javax.mail.internet.InternetAddress;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.authz.UnauthorizedException;
import org.apache.shiro.subject.SimplePrincipalCollection;
import org.apache.shiro.subject.Subject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
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
     * @return
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
     *
     * @param entityId
     * @return
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
     *
     * @param value
     * @return
     */
    @GET
    @Path("AutoComplete/{value}")
    public List<JpaAccount> getAutoComplete(@PathParam("value") String value) {
        return accountFacade.getAutoComplete(value);
    }

    /**
     * Return accounts that match given "value" and are not yet member of the
     * given game
     *
     * @param value
     * @param gameId
     * @return
     */
    @GET
    @Path("AutoCompleteFull/{value}/{gameId : [1-9][0-9]*}")
    public List<JpaAccount> getAutoCompleteFull(@PathParam("value") String value, @PathParam("gameId") Long gameId) {
        return accountFacade.getAutoCompleteFull(value, gameId);
    }

    /**
     *
     * @param value
     * @param rolesList
     * @return
     */
    @POST
    @Path("AutoComplete/{value}")
    public List<JpaAccount> getAutoCompleteByRoles(@PathParam("value") String value, HashMap<String, Object> rolesList) {
        if (!SecurityUtils.getSubject().isRemembered() && !SecurityUtils.getSubject().isAuthenticated()) {
            throw new UnauthorizedException();
        }
        return accountFacade.getAutoCompleteByRoles(value, rolesList);
    }

    /**
     *
     * @param values
     * @return
     */
    @GET
    @Path("FindAccountsByEmailValues")
    public List<Map> findAccountsByEmailValues(@QueryParam("values") List<String> values) {
        return accountFacade.findAccountsByEmailValues(values);
    }

    /**
     *
     * @param values
     * @return
     */
    @GET
    @Path("FindAccountsByName")
    public List<JpaAccount> findAccountsByName(@QueryParam("values") List<String> values) {
        if (!SecurityUtils.getSubject().isRemembered() && !SecurityUtils.getSubject().isAuthenticated()) {
            throw new UnauthorizedException();
        }
        return accountFacade.findAccountsByName(values);
    }

    /**
     *
     * @param user
     * @return
     */
    @POST
    public User create(User user) {
        SecurityUtils.getSubject().checkPermission("User:Edit");

        userFacade.create(user);
        return user;
    }

    /**
     *
     * @param entityId
     * @param entity
     * @return
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
     *
     * @param accountId
     * @return
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
     *
     * Allows to login using a post request
     *
     * @param authInfo
     * @param request
     * @param response
     * @throws javax.servlet.ServletException
     * @throws java.io.IOException
     */
    @POST
    @Path("Authenticate")
    public void login(AuthenticationInformation authInfo, 
            @Context HttpServletRequest request, 
            @Context HttpServletResponse response) throws ServletException, IOException {
        
        Subject subject = SecurityUtils.getSubject();

        //if (!currentUser.isAuthenticated()) {
        UsernamePasswordToken token = new UsernamePasswordToken(authInfo.getLogin(), authInfo.getPassword());
        token.setRememberMe(authInfo.isRemember());
        try {
            subject.login(token);                                               // try to log in.
        } catch (AuthenticationException aex) {
            if (checkGameAccountKeylogin(authInfo.getLogin(), authInfo.getPassword())) {
                try {
                    //Login failed, maybe create a GameAccount or fail
                    gameFacade.findGameAccountKey(authInfo.getLogin());
                    subject.login(token);
                } catch (WegasNoResultException ex) {
                    throw WegasErrorMessage.error("Email/password combination not found");
                }
            } else {
                throw WegasErrorMessage.error("Email/password combination not found");
            }
        }
    }

    @GET
    @Path("Logout")
    public Response logout(){
        SecurityUtils.getSubject().logout();
        return Response.status(Response.Status.OK).build();
    }

    /**
     *
     * @param authInfo
     */
    @POST
    @Path("GuestLogin")
    public void guestLogin(AuthenticationInformation authInfo) {
        userFacade.guestLogin();
    }

    /**
     *
     * @param authInfo
     */
    @POST
    @Path("TeacherGuestLogin")
    @Deprecated
    public void teacherGuestLogin(AuthenticationInformation authInfo) {
        User user = userFacade.guestLogin();
        try {
            user.getMainAccount().addRole(roleFacade.findByName("Scenarist"));
        } catch (WegasNoResultException ex) {
            throw WegasErrorMessage.error("Teacher mode is not available");
        }
    }

    /**
     *
     * @return
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
     *
     * @param username
     * @param password
     * @param firstname
     * @param lastname
     * @param email
     */
    @POST
    @Path("Signup")
    @Deprecated
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public void signup(@FormParam("username") String username,
            @FormParam("password") String password,
            @FormParam("firstname") String firstname,
            @FormParam("lastname") String lastname,
            @FormParam("email") String email) {
        JpaAccount account = new JpaAccount();                                   // Convert post params to entity
        account.setUsername(username);
        account.setPassword(password);
        account.setFirstname(firstname);
        account.setLastname(lastname);
        account.setEmail(email);
        this.signup(account);                                                   // and forward
    }
    
    /**
     * Create a user based with a JpAAccount
     *
     * @param account
     * @return Response : Status Not acceptable if email is wrong or username already exist. Created otherwise.
     */
    @POST
    @Path("Signup")
    public Response signup(JpaAccount account) {
        Response r;
        if(this.checkEmailString(account.getEmail())){
            if(account.getUsername().equals("") || !this.checkExistingUsername(account.getUsername())){
                User user = new User(account);
                userFacade.create(user);
                r = Response.status(Response.Status.CREATED).build();
            }else{
                r = Response.status(Response.Status.BAD_REQUEST).entity(WegasErrorMessage.error("The username is already taken.")).build();
            }
        }else{
            r = Response.status(Response.Status.BAD_REQUEST).entity(WegasErrorMessage.error("The email isn't correct.")).build();
        }
        return r;
    }

    /**
     *
     * @param email
     * @param request
     */
    @POST
    @Path("SendNewPassword")
    public void sendNewPassword(AuthenticationInformation authInfo,
            @Context HttpServletRequest request) {
        userFacade.sendNewPassword(authInfo.getLogin());
    }

    /**
     * Get all GameModel permissions by GameModel id
     *
     * @param instance
     * @return
     */
    @GET
    @Path("FindPermissionByInstance/{instance}")
    public List<Map> findPermissionByInstance(@PathParam(value = "instance") String instance) {

        checkGmOrGPermission(instance, "GameModel:Edit:", "Game:Edit:");

        return this.userFacade.findRolePermissionByInstance(instance);
    }
    
    /**
     * Get the current user, error 400 if there is no user logged. 
     * @return user, the current user;
     */
    @GET
    @Path("Current")
    public User getCurrentUser() {
        return userFacade.getCurrentUser();
    }

    /**
     * Delete permission by role and permission
     *
     * @param roleId
     * @param permission
     * @return
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
     * @return
     */
    @POST
    @Path("AddPermission/{roleId : [1-9][0-9]*}/{permission}")
    public boolean addPermissionsByInstance(@PathParam(value = "roleId") Long roleId, @PathParam(value = "permission") String permission) {

        String splitedPermission[] = permission.split(":");

        checkGmOrGPermission(splitedPermission[2], "GameModel:Edit:", "Game:Edit:");

        return this.userFacade.addRolePermission(roleId, permission);
    }

    /**
     *
     * @param roleName
     * @param permission
     * @return
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
     * @return
     */
    @POST
    @Path("DeleteAllRolePermissions/{roleId : [1-9][0-9]*}/{gameModelId}")
    public boolean deleteAllRolePermissions(@PathParam("roleId") Long roleId,
            @PathParam("gameModelId") String id) {

        checkGmOrGPermission(id, "GameModel:Edit:", "Game:Edit:");

        return this.userFacade.deleteRolePermissionsByIdAndInstance(roleId, id);
    }

    /**
     *
     * @param roleName
     * @param id
     * @return
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
     *
     * @param entityId
     * @return
     */
    @GET
    @Path("FindAccountPermissionByInstance/{entityId}")
    public List<AbstractAccount> findAccountPermissionByInstance(@PathParam("entityId") String entityId) {

        checkGmOrGPermission(entityId, "GameModel:Edit:", "Game:Edit:");

        return userFacade.findAccountPermissionByInstance(entityId);
    }

    /**
     *
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
     *
     * @param entityId
     * @param accountId
     */
    @DELETE
    @Path("DeleteAccountPermissionByInstanceAndAccount/{entityId}/{accountId : [1-9][0-9]*}")
    public void deleteAccountPermissionByInstanceAndAccount(@PathParam("entityId") String entityId,
            @PathParam("accountId") Long accountId) {

        checkGmOrGPermission(entityId, "GameModel:Edit:", "Game:Edit:");

        userFacade.deleteAccountPermissionByInstanceAndAccount(entityId, accountId);
    }

    /**
     *
     * @param permission
     * @param accountId
     */
    @DELETE
    @Path("DeleteAccountPermissionByPermissionAndAccount/{permission}/{accountId : [1-9][0-9]*}")
    public void deleteAccountPermissionByPermissionAndAccount(@PathParam("permission") String permission,
            @PathParam("accountId") Long accountId) {

        String splitedPermission[] = permission.split(":");

        checkGmOrGPermission(splitedPermission[2], "GameModel:Edit:", "Game:Edit:");

        userFacade.deleteAccountPermissionByPermissionAndAccount(permission, accountId);
    }

    private void checkGmOrGPermission(String entityId, String gmPermission, String gPermission) {
        if (entityId.substring(0, 2).equals("gm")) {
            SecurityUtils.getSubject().checkPermission(gmPermission + entityId);
        } else {
            SecurityUtils.getSubject().checkPermission(gPermission + entityId);
        }
    }

    private Boolean checkGameAccountKeylogin(String key, String password) {
        if (key.equals(password)) {                                             //Be kind, email password have to be the same...
            /*
             if there is a GameAccountKey, use it to create a new GameAccount 
             */
            try {
                GameAccountKey gameAccountKey = gameFacade.findGameAccountKey(key);
                if (gameAccountKey.getUsed()) {
                    return false;
                }
                GameAccount gameAccount = new GameAccount(gameAccountKey.getGame());
                gameAccount.setEmail(key);
                gameAccount.setPassword(password);
                gameAccount.setFirstname("Team");
                gameAccount.setLastname("Account");
                gameAccountKey.setUsed(Boolean.TRUE);
                this.signup(gameAccount);
            } catch (WegasNoResultException ex) {
                return false;
            }
            return true;
        }
        return false;
    }

    private boolean checkEmailString(String email){
        boolean validEmail = true;
        try {
            InternetAddress emailAddr = new InternetAddress(email);
            emailAddr.validate();
        } catch (AddressException ex) {
            validEmail = false;
        }
        return validEmail;
    }
    private boolean checkExistingUsername(String username){
        boolean existingUsername = false;
        User user = userFacade.getUserByUsername(username);
        if(user != null){
            existingUsername = true;
        }
        return existingUsername;
    }
}
