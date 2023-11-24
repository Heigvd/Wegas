/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.persistence.token;

import com.wegas.core.security.ejb.AccountFacade;
import jakarta.persistence.Entity;
import jakarta.servlet.http.HttpServletRequest;

/**
 *
 * @author maxence
 */
@Entity
public class ValidateAddressToken extends Token {

    /**
     * Redirect to the user to the home page
     *
     * @return root page location
     */
    @Override
    public String getRedirectTo() {
        return "/";
    }

    @Override
    public void process(AccountFacade accountFacade, HttpServletRequest request) {
        //no op
    }
}
