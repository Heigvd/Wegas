
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.aai.AaiConfigInfo;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.token.Token;
import com.wegas.core.security.persistence.User;
import com.wegas.core.security.util.AuthenticationMethod;
import com.wegas.core.security.util.TokenInfo;
import java.util.Date;
import java.util.List;
import javax.ejb.Stateless;
import javax.inject.Inject;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authz.AuthorizationException;
import org.apache.shiro.authz.annotation.RequiresPermissions;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Stateless
@Path("User/{userId :([1-9][0-9]*)?}{userSep: /?}Account")
@Consumes(MediaType.APPLICATION_JSON)
@Produces(MediaType.APPLICATION_JSON)
public class AccountController {

    /**
     *
     */
    @Inject
    private AccountFacade accountFacade;
    /**
     *
     */
    @Inject
    private UserFacade userFacade;
    /**
     *
     */
    @Inject
    private TeamFacade teamFacade;

    /**
     * Create a new account
     *
     * @param entity new account to create
     *
     * @return the user the account has been created for
     */
    @POST
    @RequiresPermissions("User:Edit")
    public User create(AbstractAccount entity) {
        // logger.log(Level.INFO, "POST GameModel");
        accountFacade.create(entity);
        return entity.getUser();
    }

    /**
     *
     * Retrieve an account
     *
     * @param entityId
     *
     * @return AbstractAccount matching given entityId
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}")
    public AbstractAccount get(@PathParam("entityId") Long entityId) {
        AbstractAccount a = accountFacade.find(entityId);
        if (!userFacade.getCurrentUser().equals(a.getUser())) {
            SecurityUtils.getSubject().checkPermission("User:Edit");
        }
        return a;
    }

    /**
     *
     * Retrieve authentication for a specific account
     *
     * @param entityId
     *
     * @return authentication method in use for this account
     *
     */
    @GET
    @Path("{entityId : [1-9][0-9]*}/AuthenticationMethod")
    public AuthenticationMethod getAuthenticationMethod(@PathParam("entityId") Long entityId) {
        AbstractAccount a = accountFacade.find(entityId);
        if (!userFacade.getCurrentUser().equals(a.getUser())) {
            SecurityUtils.getSubject().checkPermission("User:Edit");
        }
        return a.getAuthenticationMethod();
    }

    /**
     * Update an account
     *
     * @param accountId
     * @param entity
     *
     * @return up-to-date account
     *
     * @throws AuthorizationException if currentUser cannot edit users or targeted account does not
     *                                belongs to current user
     */
    @PUT
    @Path("{accountId: [1-9][0-9]*}")
    public AbstractAccount update(@PathParam("accountId") Long accountId,
        AbstractAccount entity) {
        return accountFacade.update(accountId, entity);
    }

    /**
     * Delete an account
     *
     * @param accountId
     *
     * @return the just deleted account
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
        return user;
    }

    /**
     * Get all account linked to team's players Account email addresses will be altered (by hiding
     * some parts) so they can be publicly displayed
     *
     * @param teamId id of the team we want players from
     *
     * @return List of abstractAccount which are players of the team
     */
    @GET
    @Path("FindByTeamId/{teamId: [1-9][0-9]*}")
    public List<AbstractAccount> findByTeamId(@PathParam("teamId") Long teamId) {
        return teamFacade.getInTeamAccounts(teamId);
    }

    /**
     * Sets the current user as having agreed to the general conditions.
     *
     * @param accountId
     *
     * @return up-to-date account
     *
     * @throws AuthorizationException if currentUser cannot edit users or targeted account does not
     *                                belongs to current user
     */
    @POST
    @Path("SetAgreed/{accountId: [1-9][0-9]*}")
    public AbstractAccount updateAgreedCurrentUser(@PathParam("accountId") Long accountId) {
        AbstractAccount a = accountFacade.find(accountId);
        if (!userFacade.getCurrentUser().equals(a.getUser())) {
            SecurityUtils.getSubject().checkPermission("User:Edit");
        }

        a.setAgreedTime(new Date());
        //a.setRoles(a.getRoles()); // @QuickFix @Dirty @Ugly @Broken @TODO should certainly be inside accountFacade.update
        //return accountFacade.update(accountId, a);
        return a;
    }

    /**
     * @return AAI config from properties file(s)
     */
    @GET
    @Path("AaiConfig")
    public AaiConfigInfo getAaiConfig() {
        return AaiConfigInfo.getInstance();
    }

    /**
     * Based on accountId and token hash, retrieve the full token.
     *
     * @return the full token
     *
     * @throws WegasNoResultException if the token does not exist
     */
    @POST
    @Path("Token")
    public Token getToken(TokenInfo tokenInfo) throws WegasNoResultException {
        return accountFacade.getToken(tokenInfo);
    }

    /**
     *
     * @param tokenId id of the token to process
     * @param request http request may contains useful info (such as user preferred languages)
     *
     * @return the full token, which was updated while it was being consumed.
     *
     * @throws WegasNoResultException
     */
    @PUT
    @Path("ProcessToken/{tokenId: [1-9][0-9]*}")
    public Token processToken(@PathParam("tokenId") Long tokenId,
        @Context HttpServletRequest request) throws WegasNoResultException {
        return accountFacade.processToken(tokenId, request);
    }

}
