/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.app.jsf.controllers;

import java.io.Serializable;
import java.util.ResourceBundle;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@ManagedBean(name = "loginController")
@SessionScoped
public class LoginController implements Serializable {

    /**
     *
     */
    private Boolean guestAllowed = this.setGuestAllowed();

    /**
     *
     */
    public LoginController() {
    }

    public void loginAsGuest() {
        if (this.guestAllowed) {
            //TODO : login as guest
        }
    }

    private Boolean setGuestAllowed() {
        if (ResourceBundle.getBundle("wegas-app.wegasapp").getString("guest_allowed").equals("none")) {
            return false;
        } else {
            return true;
        }
    }

    public Boolean isGuestAllowed() {
        return guestAllowed;
    }

    //JSTL compliant
    public Boolean getGuestAllowed() {
        return this.isGuestAllowed();
    }
}
