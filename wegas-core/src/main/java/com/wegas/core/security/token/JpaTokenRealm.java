
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.token;

import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.token.Token;
import com.wegas.core.security.util.JpaAuthenticationInfo;
import java.util.Date;
import javax.ejb.EJBException;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.util.SimpleByteSource;

/**
 *
 * Realm to authenticate account with a disposable token
 *
 * @author Maxence
 */
public class JpaTokenRealm extends AuthorizingRealm {

    public static final String REALM_NAME = "JpaTokenRealm";

    /**
     *
     */
    public JpaTokenRealm() {
        setName(REALM_NAME);
    }

    @Override
    public boolean supports(AuthenticationToken token) {
        return token instanceof TokenAuthToken;
    }

    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authcToken) throws AuthenticationException {
        if (authcToken instanceof TokenAuthToken) {
            TokenAuthToken tokenAuth = (TokenAuthToken) authcToken;
            if (tokenAuth.getAccountId() > 0) {
                // can only authenticate effective account
                AccountFacade accountFacade = AccountFacade.lookup();

                RequestManager requestManager = RequestFacade.lookup().getRequestManager();
                try {
                    requestManager.su();

                    // effective authentication is done here !
                    Token token = accountFacade.getToken(tokenAuth);

                    if (token != null) {
                        Date expiryDate = token.getExpiryDate();
                        // check expiry date
                        if (expiryDate != null) {
                            Long now = (new Date()).getTime();
                            if (now > expiryDate.getTime()) {
                                //todo destroy outdated token
                                return null;
                            }
                        }
                        if (!token.isAutoLogin()) {
                            // can not log with such a token
                            return null;
                        }

                        AbstractAccount account = token.getAccount();

                        JpaAuthenticationInfo info = new JpaAuthenticationInfo(
                            account.getId(),
                            token.getToken(),
                            new SimpleByteSource(account.getShadow().getSalt()),
                            getName(),
                            account.getShadow().getHashMethod());
                        return info;
                    }
                } catch (WegasNoResultException e) {// NOPMD

                } finally {
                    requestManager.releaseSu();
                }
            }
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
