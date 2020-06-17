/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.guest;

import org.apache.shiro.authc.HostAuthenticationToken;
import org.apache.shiro.authc.RememberMeAuthenticationToken;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class GuestToken implements HostAuthenticationToken, RememberMeAuthenticationToken {

    private static final long serialVersionUID = 1L;
    private final Long principal;

    /**
     *
     * @param principal
     */
    public GuestToken(Long principal) {
        this.principal = principal;
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
        return this.principal;
    }

    @Override
    public Object getCredentials() {
        return null;
    }
}
