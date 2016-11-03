/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.jparealm;

import com.wegas.core.Helper;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import javax.ejb.EJBException;
import javax.naming.NamingException;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.SimpleByteSource;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class JpaRealm extends AuthorizingRealm {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(JpaRealm.class);

    /**
     *
     */
    public JpaRealm() {
        setName("JpaRealm");                                                    //This name must match the name in the User class's getPrincipals() method
    }

    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authcToken) throws AuthenticationException {
        UsernamePasswordToken token = (UsernamePasswordToken) authcToken;
        try {
            AccountFacade accountFacade = accountFacade();
            try {
                JpaAccount account = accountFacade.findByEmail(token.getUsername());
                SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(account.getId(), account.getPasswordHex(), getName());
                info.setCredentialsSalt(new SimpleByteSource(account.getSalt()));
                return info;

            } catch (WegasNoResultException e) {                                         // Could not find correponding mail, 
                try {
                    JpaAccount account = (JpaAccount) accountFacade.findByUsername(token.getUsername());// try with the username
                    SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(account.getId(), account.getPasswordHex(), getName());
                    info.setCredentialsSalt(new SimpleByteSource(account.getSalt()));
                    return info;

                } catch (WegasNoResultException ex) {
                    logger.error("Unable to find token", ex);
                    return null;
                }
            }
        } catch (NamingException ex) {
            logger.error("Unable to find AccountFacade EJB", ex);
            return null;
        }
    }

    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        try {
//            if (principals.fromRealm(this.getName()).size() > 0) {
//                Long accountId = (Long) principals.fromRealm(getName()).iterator().next();
//                AbstractAccount account = accountFacade().find(accountId);
//            }

            AbstractAccount account = accountFacade().find((Long) principals.getPrimaryPrincipal());
            User user = account.getUser();
            SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();
            for (Role role : user.getRoles()) {
                info.addRole(role.getName());

                for (Permission p : role.getPermissions()) {
                    addPermissions(info, p);
                }
            }

            for (Permission p : user.getPermissions()) {
                addPermissions(info, p);
            }
            return info;
        } catch (EJBException e) {
            return null;
        } catch (NamingException ex) {
            logger.error("Unable to find AocountFacade EJB", ex);
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

    /**
     *
     * @param info
     * @param p
     */
    public static void addPermissions(SimpleAuthorizationInfo info, Permission p) {
        info.addStringPermission(p.getValue());
        if (p.getInducedPermission() != null && !p.getInducedPermission().isEmpty()) {
            info.addStringPermission(p.getInducedPermission());
        }
    }
}
