/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.ejb.exception.PersistenceException;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.GuestAccount;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
import java.io.Serializable;
import java.util.Locale;
import java.util.ResourceBundle;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.ejb.EJBException;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.context.FacesContext;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.subject.Subject;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@ManagedBean(name = "requestController")
@RequestScoped
public class RequestController implements Serializable {

    /**
     *
     */
    @EJB
    private UserFacade userFacade;
    /**
     *
     */
    @ManagedProperty(value = "#{param.lang}")
    private String lang = "en";
    /**
     *
     */
    private User currentUser;

    /**
     *
     * @throws IOException if the target we dispatch to do not exist
     */
    @PostConstruct
    public void init() throws IOException {
        if (this.lang != null) { // If a language parameter is provided, it overrides the Accept-Language header
            FacesContext.getCurrentInstance().getViewRoot().setLocale(new Locale(this.lang));
        }
    }

    /**
     * @return the lang
     */
    public String getLang() {
        return lang;
    }

    /**
     * @param lang the lang to set
     */
    public void setLang(String lang) {
        this.lang = lang;
    }

    /**
     * @return the locale
     */
    public Locale getLocale() {
        if (this.lang != null) {
            return new Locale(this.lang);
        }
        FacesContext context = FacesContext.getCurrentInstance();
        if (context.getExternalContext().getRequestLocale() != null) {
            return context.getExternalContext().getRequestLocale();
            //return context.getExternalContext().getRequestLocales();          // @fixme Could return a list of locales instaed
        }
        if (context.getViewRoot().getLocale() != null) {
            return context.getViewRoot().getLocale();
        }

        if (context.getApplication().getDefaultLocale() != null) {
            return context.getApplication().getDefaultLocale();
        }
        return Locale.getDefault();
    }

    /**
     * @return the currentUser
     */
    public User getCurrentUser() {
        final Subject subject = SecurityUtils.getSubject();

        if (subject.isAuthenticated()) {                                        // If the user is logged
            final String principal = subject.getPrincipal().toString();
            try {
                return userFacade.getUserByPrincipal(
                        subject.getPrincipal().toString());
            }
            catch (EJBException e) {                                            // If we cannot find a corresponding account.
                if (e.getCause() instanceof PersistenceException) {             // that means we need to create one.
                    // @fixme normally an authenticated user should always have an account
                    //User newUser = new User();
                    //AbstractAccount acc = new JdbcRealmAccount();
                    //acc.setPrincipal(principal);
                    //acc.setFirstname(principal);
                    //acc.setLastname("");
                    //newUser.addAccount(acc);
                    //userFacade.create(newUser);
                    return null;
                } else {
                    throw e;
                }
            }
        } else {                                                                // If the user is not logged in
            User newUser = new User(new GuestAccount());                        // return a Guest user

            if (ResourceBundle.getBundle("wegas").getString("guestallowed").equals("true")) {
                //userFacade.create(newUser);                                   // @fixme For now we do not persist this new user
            }
            return newUser;
        }
    }

    /**
     * @param currentUser the currentUser to set
     */
    public void setCurrentUser(User currentUser) {
        this.currentUser = currentUser;
    }
}
