/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.rest;

import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.User;
import java.util.List;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import org.apache.shiro.SecurityUtils;
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
    @EJB
    private AccountFacade accountFacade;
    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    @EJB
    private TeamFacade teamFacade;

    /**
     *
     * @param entity
     * @return
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
     * @param entityId
     * @return
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
     * @param accountId
     * @param entity
     * @return
     */
    @PUT
    @Path("{accountId: [1-9][0-9]*}")
    public AbstractAccount update(@PathParam("accountId") Long accountId,
            AbstractAccount entity) {
        AbstractAccount a = accountFacade.find(accountId);
        if (!userFacade.getCurrentUser().equals(a.getUser())) {
            SecurityUtils.getSubject().checkPermission("User:Edit");
        }
        if (!SecurityUtils.getSubject().isPermitted("User:Edit")) {
            // restore original permission in case current user lack UserEdit permission
            entity.setPermissions(a.getPermissions());
        }
        return accountFacade.update(accountId, entity);
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
    }

    /**
     *
     * @param teamId
     * @return
     */
    @GET
    @Path("FindByTeamId/{teamId: [1-9][0-9]*}")
    public List<AbstractAccount> findByTeamId(@PathParam("teamId") Long teamId) {
        return teamFacade.getDetachedAccounts(teamId);
    }
}
