/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.wegas.core.Helper;
import java.util.ArrayList;
import java.util.List;

/**
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class AuthenticationInformation {

    private String login;

    /**
     * hashed salted password
     */
    private List<String> hashes = new ArrayList<>();

    private boolean remember;
    private boolean agreed = false;

    public AuthenticationInformation() {
        // ensure there is a default constructor
    }

    public String getLogin() {
        return login;
    }

    public void setLogin(String login) {
        this.login = login;
    }

    public List<String> getHashes() {
        return hashes;
    }

    public void setHashes(List<String> hashes) {
        this.hashes = hashes;
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

    public void addHash(HashMethod method, String password, String salt){
        if (method != null){
            this.getHashes().add(method.hash(password, Helper.coalesce(salt)));
        }
    }
}
