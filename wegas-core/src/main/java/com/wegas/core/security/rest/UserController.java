/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import java.sql.SQLException;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.*;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.UsernamePasswordToken;
import org.apache.shiro.subject.SimplePrincipalCollection;
import org.apache.shiro.subject.Subject;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("User")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserController {

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
     * @return
     */
    @GET
    public Collection<User> index() {

        SecurityUtils.getSubject().checkPermission("User:Edit");

        return userFacade.findAll();
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
    
    @GET
    @Path("AutoComplete/{value}")
    public List<Map> getAutoComplete(@PathParam("value") String value) {
        SecurityUtils.getSubject().isAuthenticated();
        return userFacade.findAccountByValue(value);
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
     * @param email
     * @param password
     * @param remember
     * @param request
     */
    @POST
    @Path("Authenticate")
    public void login(@QueryParam("email") String email,
            @QueryParam("password") String password,
            @QueryParam("remember") @DefaultValue("false") boolean remember,
            @Context HttpServletRequest request) {

        Subject subject = SecurityUtils.getSubject();

        //if (!currentUser.isAuthenticated()) {
        UsernamePasswordToken token = new UsernamePasswordToken(email, password);
        token.setRememberMe(remember);
        subject.login(token);
        //}
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
     * Create a user based with a JpAAccount
     *
     * @param account
     * @throws SQLException
     */
    @POST
    @Path("Signup")
    public void signup(JpaAccount account) throws SQLException {
        User user = new User(account);                                          // Add the user to db
        userFacade.create(user);
    }

    /**
     *
     * @param username
     * @param password
     * @param firstname
     * @param lastname
     * @param email
     * @throws SQLException
     */
    @POST
    @Path("Signup")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    public void signup(@FormParam("username") String username,
            @FormParam("password") String password,
            @FormParam("firstname") String firstname,
            @FormParam("lastname") String lastname,
            @FormParam("email") String email) throws SQLException {
        JpaAccount account = new JpaAccount();                                   // Convert post params to entity
        account.setUsername(username);
        account.setPassword(password);
        account.setFirstname(firstname);
        account.setLastname(lastname);
        account.setEmail(email);
        this.signup(account);                                                   // and forward
    }

    /**
     *
     * @param email
     * @param request
     */
    @POST
    @Path("SendNewPassword")
    public void sendNewPassword(@QueryParam("email") String email,
            @Context HttpServletRequest request) {
        userFacade.sendNewPassword(email);
    }

    /**
     * Get all GameModel permissions by GameModel id
     *
     * @param id
     * @return
     */
    @GET
    @Path("FindPermissionByInstance/{instance}")
    public List<Map> findPermissionByInstance(@PathParam(value = "instance") String instance) {

        checkGmOrGPermission(instance, "GameModel:Edit:", "Game:Edit:");

        return this.userFacade.findRolePermissionByInstance(instance);
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
     
    @POST
    @Path("AddPermission/{roleName}/{permission}")
    public boolean addPermissionsByInstance(@PathParam(value = "roleName") String roleName, @PathParam(value = "permission") String permission) {
        return this.addPermissionsByInstance(roleFacade.findByName(roleName).getId(), permission);
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
    
    @POST
    @Path("DeleteAllRolePermissions/{roleName}/{gameModelId}")
    public boolean deleteAllRolePermissions(@PathParam("roleName") String roleName,
            @PathParam("gameModelId") String id) {
        return this.deleteAllRolePermissions(roleFacade.findByName(roleName).getId(), id);
    }
    
    @GET
    @Path("FindAccountPermissionByInstance/{entityId}")
    public List<AbstractAccount> findAccountPermissionByInstance(@PathParam("entityId") String entityId) {
        
        checkGmOrGPermission(entityId, "GameModel:Edit:", "Game:Edit:");
 
        return userFacade.findAccountPermissionByInstance(entityId);
    }
    
    @POST
    @Path("addAccountPermission/{permission}/{accountId : [1-9][0-9]*}")
    public void addAccountPermission(@PathParam("permission") String permission, 
            @PathParam("accountId") Long accountId) {
        
        String splitedPermission[] = permission.split(":");
        
        checkGmOrGPermission(splitedPermission[2], "GameModel:Edit:", "Game:Edit:");
        
        userFacade.addAccountPermission(accountId, permission);
    }
    
    @DELETE
    @Path("DeleteAccountPermissionByInstanceAndAccount/{entityId}/{accountId : [1-9][0-9]*}")
    public void deleteAccountPermissionByInstanceAndAccount(@PathParam("entityId") String entityId, 
            @PathParam("accountId") Long accountId) {
        
        checkGmOrGPermission(entityId, "GameModel:Edit:", "Game:Edit:");
        
        userFacade.deleteAccountPermissionByInstanceAndAccount(entityId, accountId);
    }
    
    @DELETE
    @Path("DeleteAccountPermissionByPermissionAndAccount/{permission}/{accountId : [1-9][0-9]*}")
    public void DeleteAccountPermissionByPermissionAndAccount(@PathParam("permission") String permission, 
            @PathParam("accountId") Long accountId) {
        
        String splitedPermission[] = permission.split(":");
        
        checkGmOrGPermission(splitedPermission[2], "GameModel:Edit:", "Game:Edit:");
        
        userFacade.DeleteAccountPermissionByPermissionAndAccount(permission, accountId);
    }
    
    private void checkGmOrGPermission(String entityId, String gmPermission, String gPermission) {        
        if (entityId.substring(0, 2).equals("gm")) {
            SecurityUtils.getSubject().checkPermission(gmPermission + entityId);
        } else {
            SecurityUtils.getSubject().checkPermission(gPermission + entityId);
        }
    }
}
