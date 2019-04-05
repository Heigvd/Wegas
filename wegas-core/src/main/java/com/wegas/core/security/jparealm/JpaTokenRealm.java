/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.jparealm;

import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.persistence.Permission;
import java.util.Date;
import javax.ejb.EJBException;
import org.apache.shiro.authc.*;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.SimpleByteSource;
import org.slf4j.LoggerFactory;

/**
 *
 * Realm to authentication JPAAccount when the user is requesting a new password
 *
 * @author Maxence
 */
public class JpaTokenRealm extends AuthorizingRealm {

    private static final org.slf4j.Logger logger = LoggerFactory.getLogger(JpaTokenRealm.class);

    /**
     *
     */
    public JpaTokenRealm() {
        setName("JpaRealmResetToken"); //This name must match the name in the User class's getPrincipals() method
    }

    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authcToken) throws AuthenticationException {
        UsernamePasswordToken token = (UsernamePasswordToken) authcToken;
        AccountFacade accountFacade = AccountFacade.lookup();
        try {
            JpaAccount account = accountFacade.findJpaByEmail(token.getUsername());

            String resetToken = account.getToken();
            if (resetToken != null) {
                String[] tokenElemeents = resetToken.split(":");
                Long expirationDate = Long.parseLong(tokenElemeents[0], 10);
                String theToken = tokenElemeents[1];

                Long now = (new Date()).getTime();

                if (now < expirationDate) {
                    SimpleAuthenticationInfo info = new SimpleAuthenticationInfo(account.getId(), theToken, getName());
                    info.setCredentialsSalt(new SimpleByteSource(account.getSalt()));
                    return info;
                }
            }
        } catch (WegasNoResultException e) {
        }
        return null;
    }

    @Override
    protected AuthorizationInfo doGetAuthorizationInfo(PrincipalCollection principals) {
        try {
            SimpleAuthorizationInfo info = new SimpleAuthorizationInfo();

            RequestManager rManager = RequestFacade.lookup().getRequestManager();

            for (String roleName : rManager.getEffectiveRoles()) {
                info.addRole(roleName);
            }

            /**
             * Load permissions from DB
             */
            for (String p : rManager.getEffectiveDBPermissions()) {
                info.addStringPermission(p);
            }

            return info;
        } catch (EJBException e) {
            Helper.printWegasStackTrace(e);
            return null;
        }
    }

    /**
     *
     * @param info
     * @param p
     */
    public static void addPermissions(SimpleAuthorizationInfo info, Permission p) {
        info.addStringPermission(p.getValue());
        /*if (p.getInducedPermission() != null && !p.getInducedPermission().isEmpty()) {
            info.addStringPermission(p.getInducedPermission());
        }*/
    }
}
