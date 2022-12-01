/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.aai;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.security.ejb.AccountFacade;
import org.apache.shiro.authc.AuthenticationException;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authz.AuthorizationInfo;
import org.apache.shiro.authz.SimpleAuthorizationInfo;
import org.apache.shiro.realm.AuthorizingRealm;
import org.apache.shiro.subject.PrincipalCollection;
import org.slf4j.LoggerFactory;


/**
 * @author jarle.hulaas@heig-vd.ch on 07.03.2017.
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
        //Effective authorisations are fetched by JpaRealm in all case
        return new SimpleAuthorizationInfo();
    }

    @Override
    protected AuthenticationInfo doGetAuthenticationInfo(AuthenticationToken authcToken) throws AuthenticationException {
        AaiToken token = (AaiToken) authcToken;
        //Long userid = (Long)token.getPrincipal();
        AaiUserDetails userDetails = token.getUserDetails();
        AccountFacade accountFacade = AccountFacade.lookup();
        RequestManager requestManager = RequestFacade.lookup().getRequestManager();
        try {
            requestManager.su();
            AaiAccount account = accountFacade.findByPersistentId(userDetails.getPersistentId());
            AaiAuthenticationInfo info = new AaiAuthenticationInfo(account.getId(), userDetails, getName());
            return info;
        } catch (WegasNoResultException ex) {
            logger.error("Unable to find token", ex);
            return null;
        } finally {
            requestManager.releaseSu();
        }
    }
}
