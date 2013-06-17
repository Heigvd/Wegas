/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.jparealm;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
import com.wegas.core.Helper;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
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
 * @author fx
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
            JpaAccount account = (JpaAccount) accountFacade().findByEmail(token.getUsername());
            SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(account.getId(), account.getPasswordHex(), getName());
            info.setCredentialsSalt(new SimpleByteSource(account.getSalt()));
            return info;
        } catch (EJBException e) {
            return null;
        } catch (NamingException ex) {
            logger.error("Unable to find AocountFacade EJB", ex);
            return null;
        }
    }

    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        try {
            Long accountId = (Long) principals.fromRealm(getName()).iterator().next();

            AbstractAccount account = accountFacade().find(accountId);
            SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();
            for (Role role : account.getRoles()) {
                info.addRole(role.getName());

                for (Permission p : role.getPermissions()) {
                    info.addStringPermission(p.getValue());
                    info.addStringPermission(p.getInducedPermission());
                }
            }

            for (Permission p : account.getPermissions()) {
                info.addStringPermission(p.getValue());
                info.addStringPermission(p.getInducedPermission());
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
}