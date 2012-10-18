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

import com.wegas.core.rest.AbstractRestController;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.User;
import java.sql.SQLException;
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
public class UserController extends AbstractRestController<UserFacade, User> {

    /**
     *
     */
    @EJB
    private UserFacade userFacade;

    /**
     *
     * @return
     */
    @Override
    protected UserFacade getFacade() {
        return this.userFacade;
    }

    /**
     *
     * Allows to login using a post request
     *
     * @param email
     * @param password
     * @param rememberMe
     * @param request
     */
    @POST
    @Path("Authenticate")
    @Produces(MediaType.APPLICATION_JSON)
    public void login(@QueryParam("email") String email,
            @QueryParam("password") String password,
            @QueryParam("remember") @DefaultValue("false") boolean remember,
            @Context HttpServletRequest request) {

        Subject currentUser = SecurityUtils.getSubject();
        System.out.println("authenticated");
        if (!currentUser.isAuthenticated()) {
            System.out.println("true");
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
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public void signup(JpaAccount account) throws SQLException {
        User user = new User(account);                                          // Add the user to db
        userFacade.create(user);
    }

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
}
