/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.facebook;

import java.util.ArrayList;
import java.util.Collection;
import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.subject.PrincipalCollection;
import org.apache.shiro.subject.SimplePrincipalCollection;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class FacebookAuthenticationInfo implements AuthenticationInfo {

    private static final long serialVersionUID = 1L;
    private PrincipalCollection principalCollection;

    /**
     *
     * @param facebookUserDetails
     * @param realmName
     */
    public FacebookAuthenticationInfo(FacebookUserDetails facebookUserDetails, String realmName) {
        Collection<String> principals = new ArrayList<>();
        principals.add(facebookUserDetails.getId());
        principals.add(facebookUserDetails.getFirstname() + " " + facebookUserDetails.getLastname()); // Is this appropriate is the name not really a Principal ?
        this.principalCollection = new SimplePrincipalCollection(principals, realmName);
    }

    @Override
    public PrincipalCollection getPrincipals() {
        return principalCollection;
    }

    @Override
    public Object getCredentials() {
        return null;// no credentials required
    }
}
