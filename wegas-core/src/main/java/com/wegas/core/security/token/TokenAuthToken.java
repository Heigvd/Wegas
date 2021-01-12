/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.token;

import com.wegas.core.security.util.TokenInfo;
import org.apache.shiro.authc.HostAuthenticationToken;
import org.apache.shiro.authc.RememberMeAuthenticationToken;

/**
 * Shiro token to authenticate subject with with disposable token
 *
 * @author maxence
 */
public class TokenAuthToken extends TokenInfo implements HostAuthenticationToken, RememberMeAuthenticationToken {

    public TokenAuthToken(Long accountId, String token) {
        super(accountId, token);
    }

    @Override
    public boolean isRememberMe() {
        return true;
    }

    @Override
    public String getHost() {
        return null;
    }

    @Override
    public Object getPrincipal() {
        return this.getAccountId();
    }

    @Override
    public Object getCredentials() {
        return this.getToken().toCharArray();
    }
}
