/*
* Wegas
* http://wegas.albasim.ch
*
* Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
* Licensed under the MIT License
*/

package com.wegas.core.security.util;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class AuthenticationInformation {

    private String login;
    private String password;
    private boolean remember;
    private boolean agreed = false;

    public AuthenticationInformation() {
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public boolean isRemember() {
        return remember;
    }

    public void setRemember(boolean remember) {
        this.remember = remember;
    }

    public boolean isAgreed() {
        return agreed;
    }

    public void setAgreed(Boolean agreed) {
        this.agreed = agreed;
    }
}
