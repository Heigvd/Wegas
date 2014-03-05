/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import com.wegas.core.Helper;
import com.wegas.core.exception.NoResultException;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.GameAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
import java.io.Serializable;
import java.util.Locale;
import javax.annotation.PostConstruct;
import javax.ejb.EJB;
import javax.enterprise.context.RequestScoped;
import javax.faces.bean.ManagedBean;
import javax.faces.bean.ManagedProperty;
import javax.faces.context.FacesContext;
import javax.servlet.http.HttpServletRequest;

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
    @ManagedProperty("#{param.lang}")
    private String lang = "en";
    /**
     *
     */
    @ManagedProperty("#{param.debug}")
    private String debug;

    /**
     *
     */
    @PostConstruct
    public void init() {
        FacesContext context = FacesContext.getCurrentInstance();
        if (this.lang != null) { // If a language parameter is provided, it overrides the Accept-Language header
            context.getViewRoot().setLocale(new Locale(this.lang));
        }
        try {
            /*
             GameAccount, be a good boy, please go to your game page. 
             */
            if (this.getCurrentUser().getMainAccount() instanceof GameAccount) {
                try {
                    HttpServletRequest request = (HttpServletRequest) context.getExternalContext().getRequest();
                    String query = (request.getServletPath() != null) ? request.getServletPath() : "";
                    query += (request.getQueryString() != null) ? "?" + request.getQueryString() : "";
                    String goTo = "/game.html?token=" + ((GameAccount) this.getCurrentUser().getMainAccount()).getToken();
                    if (query == null ? goTo != null : !query.equals(goTo)) {
                        context.getExternalContext().redirect(request.getContextPath() + goTo);
                    }
                } catch (IOException ex) {
                    //page not found. 
                }

            }
        } catch (NoResultException ex) {// no user
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
        return userFacade.getCurrentUser();
    }

    public String getCurrentRoles() {
        String cssClass = "";
        try {
            for (Role r : userFacade.getCurrentUser().getMainAccount().getRoles()) {
                cssClass += " wegas-group-" + r.getName();
            }
            return cssClass.toLowerCase();
        } catch (NoResultException e) {
            return ""; // Current user could not be found
        }
    }

    /**
     * @return the debug
     */
    public String getDebug() {
        return debug;
    }

    /**
     * @param debug the debug to set
     */
    public void setDebug(String debug) {
        this.debug = debug;
    }

    public Boolean debugMode() {
        if (debug == null) {
            return Boolean.valueOf(Helper.getWegasProperty("debug", "false"));
        }
        return Boolean.valueOf(this.getDebug());
    }
}
