/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */

package com.wegas.core.security.persistence.token;

import com.wegas.core.security.ejb.AccountFacade;
import com.wegas.core.security.persistence.token.Token;
import javax.persistence.Entity;
import javax.servlet.http.HttpServletRequest;

/**
 *
 * @author maxence
 */
@Entity
public class ResetPasswordToken extends Token {

    /**
     * Redirect to the user to its profile page
     *
     * @return user profile edition page location
     */
    public String getRedirectTo() {
        // the lobby location
        return "/#/user-profile";
    }

    @Override
    public void process(AccountFacade accountFacade, HttpServletRequest request) {
        //no op
    }
}
