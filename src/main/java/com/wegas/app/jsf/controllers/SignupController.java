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

import com.wegas.core.security.realm.JNDIAndSaltAwareJdbcRealm;
import java.io.Serializable;
import java.sql.SQLException;
import java.util.ResourceBundle;
import java.util.logging.Level;
import java.util.logging.Logger;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.SessionScoped;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.mgt.RealmSecurityManager;
import org.apache.shiro.realm.Realm;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@ManagedBean(name = "signupController")
@SessionScoped
public class SignupController implements Serializable {

    /**
     *
     */
    private String userName;
    /**
     *
     */
    private String userPass;
    /**
     *
     */
    private String msg = "";

    /**
     *
     */
    public SignupController() {
    }

    /**
     *
     */
    public void signup() {
        JNDIAndSaltAwareJdbcRealm cRealm = null;
        for (Realm r : ( (RealmSecurityManager) SecurityUtils.getSecurityManager() ).getRealms()) {
            if (r instanceof JNDIAndSaltAwareJdbcRealm) {
                cRealm = (JNDIAndSaltAwareJdbcRealm) r;
            }
        }
        try {
            cRealm.createUser(userName, userPass);
            this.msg = ResourceBundle.getBundle("com.wegas.app.Bundle").getString("SignupPage_UserCreatedMsg");
        }
        catch (SQLException ex) {
            this.msg = ResourceBundle.getBundle("com.wegas.app.Bundle").getString("SignupPage_UserCreationErrorMsg");
            Logger.getLogger(SignupController.class.getName()).log(Level.SEVERE, null, ex);
        }
    }

    /**
     * @return the msg
     */
    public String getMsg() {
        return msg;
    }

    /**
     * @param msg the msg to set
     */
    public void setMsg(final String msg) {
        this.msg = msg;
    }

    /**
     * @return the userName
     */
    public String getUserName() {
        return userName;
    }

    /**
     * @param userName the userName to set
     */
    public void setUserName(final String userName) {
        this.userName = userName;
    }

    /**
     * @return the userPass
     */
    public String getUserPass() {
        return userPass;
    }

    /**
     * @param userPass the userPass to set
     */
    public void setUserPass(final String userPass) {
        this.userPass = userPass;
    }
}

