/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.rest;

import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
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

    @GET
    @Path("{entityId : [1-9][0-9]*}")
    public User get(@PathParam("entityId") Long entityId) {
        if (!userFacade.getCurrentUser().getId().equals(entityId)) {
            SecurityUtils.getSubject().checkPermission("User:Edit");
        }

        return userFacade.find(entityId);
    }

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
     * @param entity
     * @return
     * @throws IOException
     */
    @PUT
    @Path("Account/{accountId: [1-9][0-9]*}")
    public AbstractAccount updateAccount(@PathParam("accountId") Long accountId, AbstractAccount entity) throws IOException {
        AbstractAccount a = accountFacade.find(accountId);
        if (!userFacade.getCurrentUser().equals(a.getUser())) {
            SecurityUtils.getSubject().checkPermission("User:Edit");
        }
        return accountFacade.update(accountId, entity);
    }

    @DELETE
    @Path("{entityId: [1-9][0-9]*}")
    public User delete(@PathParam("entityId") Long entityId) {
        User u = userFacade.find(entityId);

        if (!userFacade.getCurrentUser().equals(u)) {
            SecurityUtils.getSubject().checkPermission("User:Edit");
        }
        userFacade.remove(entityId);
        return u;
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

        Subject currentUser = SecurityUtils.getSubject();

        if (!currentUser.isAuthenticated()) {
            UsernamePasswordToken token = new UsernamePasswordToken(email, password);
            token.setRememberMe(remember);
            currentUser.login(token);
        }
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
    @Produces(MediaType.APPLICATION_JSON)
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
    @Path("GameModelPermissions/{gameModelId}")
    public List<Map> findPermissionByInstance(@PathParam(value = "gameModelId") String id) {

        if (id.substring(0, 2).equals("gm")) {
            SecurityUtils.getSubject().checkPermission("GameModel:Edit:" + id);
        } else {
            SecurityUtils.getSubject().checkPermission("Game:Edit:" + id);
        }

        return this.userFacade.findPermissionByInstance(id);
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
        if (splitedPermission[2].substring(0, 2).equals("gm")) {
            SecurityUtils.getSubject().checkPermission("GameModel:Edit:" + splitedPermission[2]);
        } else {
            SecurityUtils.getSubject().checkPermission("Game:Edit:" + splitedPermission[2]);
        }

        return this.userFacade.deletePermissionByInstance(roleId, permission);
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
        if (splitedPermission[2].substring(0, 2).equals("gm")) {
            SecurityUtils.getSubject().checkPermission("GameModel:Edit:" + splitedPermission[2]);
        } else {
            SecurityUtils.getSubject().checkPermission("Game:Edit:" + splitedPermission[2]);
        }

        return this.userFacade.addPermissionsByInstance(roleId, permission);
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

        if (id.substring(0, 2).equals("gm")) {
            SecurityUtils.getSubject().checkPermission("GameModel:Edit:" + id);
        } else {
            SecurityUtils.getSubject().checkPermission("Game:Edit:" + id);
        }

        return this.userFacade.deleteAllRolePermissions(roleId, id);
    }
}
