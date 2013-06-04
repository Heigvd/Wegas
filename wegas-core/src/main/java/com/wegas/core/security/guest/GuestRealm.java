/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.guest;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
import com.wegas.core.security.jparealm.*;
import com.wegas.core.Helper;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.RoleFacade;
import com.wegas.core.security.persistence.Role;
import javax.ejb.EJBException;
import javax.naming.NamingException;
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
 * @author fx
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
        return new SimpleAuthenticationInfo(authcToken.getPrincipal(), "", this.getName());
    }

    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        try {
            Role role = roleFacade().findByName("Public");
            SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();
            info.addRole("Public");
            info.addStringPermissions(role.getPermissions());
            return info;
        } catch (EJBException e) {
            return null;
        } catch (NamingException ex) {
            logger.error("Unable to find RoleFacade EJB", ex);
            return null;
        }
    }

    /**
     *
     * @return @throws NamingException
     */
    public AccountFacade accountFacade() throws NamingException {
        return Helper.lookupBy(AccountFacade.class);
    }

    public RoleFacade roleFacade() throws NamingException {
        return Helper.lookupBy(RoleFacade.class);
    }
}