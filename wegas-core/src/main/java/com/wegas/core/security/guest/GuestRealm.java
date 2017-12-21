/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.guest;

import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.jparealm.*;
import com.wegas.core.security.persistence.AbstractAccount;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.SimpleAuthenticationInfo;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class GuestRealm extends AuthorizingRealm {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(JpaRealm.class);

    /**
     *
     */
    public GuestRealm() {
        setName("GuestRealm");                                                    //This name must match the name in the User class's getPrincipals() method
    }

    @Override
    public boolean supports(AuthenticationToken token) {
        return token instanceof GuestToken;
    }

    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authcToken) throws AuthenticationException {
        Long accountId = (Long) authcToken.getPrincipal();
            AbstractAccount account = AccountFacade.lookup().find(accountId);

            if (account != null && account instanceof GuestJpaAccount) {
                return new SimpleAuthenticationInfo(authcToken.getPrincipal(), "", this.getName());
            }

        return null;
    }

    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        return new SimpleAuthorizationInfo();
        /*
        try {
            Role role;
            try {
                role = roleFacade().findByName("Public");
            } catch (NamingException ex) {
                logger.error("Unable to find RoleFacade EJB", ex);
                return null;
            } catch (WegasNoResultException ex) {
                role = null;
            }
            SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();

            info.addRole("Public");
            if (role != null) {
                for (Permission p : role.getPermissions()) {
                    JpaRealm.addPermissions(info, p);
                }
            }
            return info;
        } catch (EJBException e) {
            return null;
        }
         */
    }
}
