/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.aai;

/**
 * @author jarle.hulaas@heig-vd.ch on 07.03.2017.
 */

public class AaiLoginResponse {
    private String message;
    private boolean ok;
    private boolean newAccount;

    public AaiLoginResponse(String message, boolean ok, boolean newAccount) {
        this.setMessage(message);
        this.setOk(ok);
        this.setNewAccount(newAccount);
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public boolean isOk(){
        return ok;
    }

    public void setOk(boolean ok) {
        this.ok = ok;
    }

    public boolean isNewAccount(){
        return newAccount;
    }

    public void setNewAccount(boolean newAccount) {
        this.newAccount = newAccount;
    }
}
