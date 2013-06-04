 /*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.guest;

import org.apache.shiro.authc.HostAuthenticationToken;
import org.apache.shiro.authc.RememberMeAuthenticationToken;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class GuestToken implements HostAuthenticationToken, RememberMeAuthenticationToken {

    private Long principal;
    private String host = null;

    public GuestToken(Long principal) {
        this.principal = principal;
    }

    @Override
    public boolean isRememberMe() {
        return true;
    }

    @Override
    public String getHost() {
        return this.host;
    }

    @Override
    public Object getPrincipal() {
        return this.principal;
    }

    @Override
    public Object getCredentials() {
        return null;
    }
}