package com.wegas.core.security.aai;

import com.wegas.core.Helper;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.subject.PrincipalCollection;
import org.slf4j.LoggerFactory;
import org.apache.shiro.realm.AuthorizingRealm;

import javax.ejb.EJBException;
import javax.naming.NamingException;

import static com.wegas.core.security.jparealm.JpaRealm.addPermissions;

/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) AlbaSim, School of Business and Engineering of Western Switzerland
 * Licensed under the MIT License
 * Created by jarle.hulaas@heig-vd.ch on 07.03.2017.
 */
public class AaiRealm extends AuthorizingRealm {
    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(AaiRealm.class);

    public AaiRealm() {
        setName("AaiRealm");                //This name must match the name in the User class's getPrincipals() method
    }

    @Override
    public boolean supports(AuthenticationToken token) {
        return token instanceof AaiToken;
    }

    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {

// NB: This is copied from JpaRealm.doGetAuthorizationInfo !

        try {
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
            logger.error("Unable to find AccountFacade EJB", ex);
            return null;
        }
    }

    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authcToken) throws AuthenticationException {
        AaiToken token = (AaiToken) authcToken;
        //Long userid = (Long)token.getPrincipal();
        AaiUserDetails userDetails = token.getUserDetails();
        try {
            AccountFacade accountFacade = accountFacade();
            try {
                AaiAccount account = accountFacade.findByPersistentId(userDetails.getPersistentId());
                AaiAuthenticationInfo info = new AaiAuthenticationInfo(account.getId(), userDetails, getName());
                return info;
            } catch (WegasNoResultException ex) {
                logger.error("Unable to find token", ex);
                return null;
            }
        } catch (NamingException ex) {
            logger.error("Unable to find AccountFacade EJB", ex);
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
