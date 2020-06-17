/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.aai;

import org.apache.shiro.authc.RememberMeAuthenticationToken;

/**
 * @author jarle.hulaas@heig-vd.ch on 07.03.2017.
 */

public class AaiToken implements RememberMeAuthenticationToken {
    private static final long serialVersionUID = 1L;
    private final AaiUserDetails userDetails; // includes the persistentID
    private boolean rememberMe;
    private final Long principal;

    public AaiToken(Long principal, AaiUserDetails userDetails) {
        this.principal = principal;
        this.userDetails = userDetails;
    }

    @Override
    public boolean isRememberMe() {
        return rememberMe;
    }

    public void setRememberMe(boolean rememberMe) {
        this.rememberMe = rememberMe;
    }

    @Override
    public Object getPrincipal() {
        return principal;
    }

    public AaiUserDetails getUserDetails() {
        return userDetails;
    }

    @Override
    public Object getCredentials() {
        return null; // credentials handled by AAI - we don't need them
    }

}
