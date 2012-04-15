/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.security.facebook;

import org.apache.shiro.authc.AuthenticationToken;

/**
 *
 * @author fx
 */
public class FacebookToken implements AuthenticationToken {

    private static final long serialVersionUID = 1L;
    private String code;

    /**
     *
     * @param code
     */
    public FacebookToken(String code) {
        this.code = code;
    }

    @Override
    public Object getPrincipal() {
        return null;// not known - facebook does the login
    }

    @Override
    public Object getCredentials() {
        return null;// credentials handled by facebook - we don't need them
    }

    /**
     *
     * @return
     */
    public String getCode() {
        return code;
    }

    /**
     *
     * @param code
     */
    public void setCode(String code) {
        this.code = code;
    }
}
