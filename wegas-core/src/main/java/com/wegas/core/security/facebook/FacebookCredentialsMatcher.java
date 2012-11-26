/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.facebook;

import org.apache.shiro.authc.AuthenticationInfo;
import org.apache.shiro.authc.AuthenticationToken;
import org.apache.shiro.authc.credential.CredentialsMatcher;

/**
 *
* @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class FacebookCredentialsMatcher implements CredentialsMatcher {

    /**
     * Just confirms that token is the right type - credentials checking is done
     * by facebook OAuth
     */
    @Override
    public boolean doCredentialsMatch(AuthenticationToken token, AuthenticationInfo info) {
        if (info instanceof FacebookAuthenticationInfo) {
            return true;
        }
        return false;
    }
}
