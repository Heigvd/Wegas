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
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.util.Secured;
import javax.ejb.EJB;
import javax.ejb.Stateless;
import javax.ws.rs.Path;
import org.apache.shiro.authz.annotation.RequiresPermissions;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Stateless
@Path("User/{userId :([1-9][0-9]*)?}{userSep: /?}Account")
@Secured
@RequiresPermissions("User:Edit")
public class AccountController extends AbstractRestController<AccountFacade, AbstractAccount> {

    /**
     *
     */
    @EJB
    private AccountFacade accountFacade;

    /**
     *
     * @return
     */
    @Override
    protected AccountFacade getFacade() {
        return this.accountFacade;
    }
}
