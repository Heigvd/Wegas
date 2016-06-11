/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.facebook;

import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.credential.CredentialsMatcher;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class FacebookCredentialsMatcher implements CredentialsMatcher {

    /**
     * Just confirms that token is the right type - credentials checking is done
     * by facebook OAuth
     */
    @Override
    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        return info instanceof FacebookAuthenticationInfo;
    }
}
