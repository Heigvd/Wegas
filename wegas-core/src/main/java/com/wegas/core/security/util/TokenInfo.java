
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

/**
 * Convenient way to post a token
 *
 * @author Maxence
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class TokenInfo {

    /**
     * the token
     */
    private String token;

    private Long accountId;

    public TokenInfo() {
    }

    public TokenInfo(Long accountId, String token) {
        this.token = token;
        this.accountId = accountId;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Long getAccountId() {
        return accountId;
    }

    public void setAccountId(Long accountId) {
        this.accountId = accountId;
    }
}
