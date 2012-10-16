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
import com.wegas.core.security.jdbcrealm.JNDIAndSaltAwareJdbcRealm;
import com.wegas.core.security.jdbcrealm.JdbcRealmAccount;
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
import org.apache.shiro.mgt.RealmSecurityManager;
import org.apache.shiro.realm.Realm;
import org.apache.shiro.subject.Subject;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("User")
public class UserController extends AbstractRestController<UserFacade> {

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
     * @param userName
     * @param password
     * @param rememberMe
     * @param request
     */
    @POST
    @Path("Authenticate")
    @Produces(MediaType.APPLICATION_JSON)
    public void login(@QueryParam("username") String userName,
            @QueryParam("password") String password,
            @QueryParam("remember") @DefaultValue("false") boolean rememberMe,
            @Context HttpServletRequest request) {

        Subject currentUser = SecurityUtils.getSubject();
        System.out.println("authenticated");
        if (!currentUser.isAuthenticated()) {
            System.out.println("true");
            UsernamePasswordToken token = new UsernamePasswordToken(userName, password, rememberMe);
            token.setRememberMe(rememberMe);
            currentUser.login(token);
        }
    }

    @POST
    @Path("Signup")
    @Consumes(MediaType.APPLICATION_FORM_URLENCODED)
    @Produces(MediaType.APPLICATION_JSON)
    public void signup(@FormParam("principal") String principal,
            @FormParam("password") String password,
            @FormParam("firstname") String firstname,
            @FormParam("lastname") String lastname,
            @FormParam("email") String email) throws SQLException {
        JdbcRealmAccount account = new JdbcRealmAccount();                      // Convert post params to entity
        account.setPrincipal(principal);
        account.setPassword(password);
        this.signup(account);                                                   // and forward
    }

    /**
     * Allows to login using json parameters
     *
     * @param account
     * @throws SQLException
     */
    @POST
    @Path("Signup")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public void signup(JdbcRealmAccount account) throws SQLException {
        JNDIAndSaltAwareJdbcRealm cRealm = null;                                // Lookup for the jdbc realm
        for (Realm r : ( (RealmSecurityManager) SecurityUtils.getSecurityManager() ).getRealms()) {
            if (r instanceof JNDIAndSaltAwareJdbcRealm) {
                cRealm = (JNDIAndSaltAwareJdbcRealm) r;
            }
        }
        account.setPrincipal(account.getEmail());
        cRealm.createUser(account.getPrincipal(), account.getPassword());       // Create a user in this realm

        User user = new User(account);                                          // Add the user to db
        userFacade.create(user);
    }
}
