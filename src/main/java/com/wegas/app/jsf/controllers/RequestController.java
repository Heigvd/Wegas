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

import com.wegas.core.ejb.UserFacade;
import com.wegas.core.ejb.exception.PersistenceException;
import com.wegas.core.persistence.user.User;
import java.io.IOException;
import java.io.Serializable;
import java.util.Locale;
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

        this.setCurrentUser(findUser());
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

    //public String getLocales() {
    //}
    /**
     *
     * @return
     */
    public User findUser() {

        final Subject subject = SecurityUtils.getSubject();
        try {
            return userFacade.getUserByPrincipal(subject.getPrincipal().toString());
        }
        catch (EJBException e) {                                                   // If the user is logged in but we cannot find a
            if (e.getCause() instanceof PersistenceException) {                // corresponding account, that means we need to create one.
                User newUser = new User();
                newUser.setName(subject.getPrincipal().toString());
                userFacade.create(newUser);
                return newUser;
            } else {
                throw e;
            }
        }
    }

    /**
     * @return the currentUser
     */
    public User getCurrentUser() {
        return currentUser;
    }

    /**
     * @param currentUser the currentUser to set
     */
    public void setCurrentUser(User currentUser) {
        this.currentUser = currentUser;
    }
}
