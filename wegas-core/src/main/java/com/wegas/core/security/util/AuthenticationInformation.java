/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import java.util.HashMap;
import java.util.Map;

/**
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class AuthenticationInformation {

    private String login;

    /**
     * mandatory hash method
     */
    private HashMethod hashMethod;
    
    /**
     * optional extra password, hashed with optional method
     */
    private Map<HashMethod, String> hashes = new HashMap<>();
    
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

    public HashMethod getHashMethod() {
        return hashMethod;
    }

    public void setHashMethod(HashMethod hashMethod) {
        this.hashMethod = hashMethod;
    }

    public Map<HashMethod, String> getHashes() {
        return hashes;
    }

    public void setHashes(Map<HashMethod, String> hashes) {
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

    public void addHash(HashMethod method, String password){
        if (method != null){
            this.getHashes().put(method, method.hash(password, ""));
        }
    }
}
