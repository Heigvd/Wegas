package com.wegas.app.jsf.controllers;

import com.wegas.app.jsf.controllers.utils.HttpParam;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasNotFoundException;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import java.io.IOException;
import java.io.Serializable;
import java.util.Iterator;
import java.util.Locale;
import javax.annotation.PostConstruct;
import javax.ejb.EJBException;
import javax.enterprise.context.RequestScoped;
import javax.faces.context.FacesContext;
import javax.inject.Inject;
import javax.inject.Named;
import javax.servlet.http.HttpServletRequest;
import org.apache.shiro.SecurityUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/*
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Named("requestController")
@RequestScoped
public class RequestController implements Serializable {

    private static final long serialVersionUID = 3889537926448950055L;

    private static final Logger logger = LoggerFactory.getLogger(RequestController.class);

    private static String[] availableLocales = {"en", "fr", "fr-CH"};

    /**
     *
     */
    @Inject
    private UserFacade userFacade;
    /**
     *
     */
    @Inject @HttpParam
    private String lang;
    /**
     *
     */
    @Inject @HttpParam
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

    public String getFavicon(){
        return Helper.getWegasProperty("favicon", "favicon_red");
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

    public Locale getPreferredLocale() {
        FacesContext context = FacesContext.getCurrentInstance();
        if (context.getExternalContext().getRequestLocale() != null) {
            Iterator<Locale> locales = context.getExternalContext().getRequestLocales();
            while (locales.hasNext()) {
                Locale next = locales.next();
                for (String aLocale : availableLocales) {
                    if (next.toLanguageTag().equals(aLocale)) {
                        return next;
                    }
                }
            }
        }
        return new Locale("en");
    }

    /**
     * @return the currentUser
     */
    public User getCurrentUser() {
        try {
            return userFacade.getCurrentUser();
        } catch (EJBException ex) {
            //Failed to retrieve current user.
            FacesContext context = FacesContext.getCurrentInstance();
            SecurityUtils.getSubject().logout(); // invalidate cookie
            try {
                context.getExternalContext().redirect(((HttpServletRequest) context.getExternalContext().getRequest()).getContextPath()); // redirect to login
            } catch (IOException ex1) {
                //check if this happens.
                logger.error("Failed to get current user");
            }
            return null;
        }
    }

    /**
     *
     * @return current logged user mail
     */
    public String getCurrentUserId() {
        try {
            return this.getCurrentUser().getId().toString();
        } catch (WegasNotFoundException e) {
            return "0";
        }
    }

    /**
     *
     * @return current logged user mail
     */
    public String getCurrentUserMail() {
        try {
            return ((JpaAccount) this.getCurrentUser().getMainAccount()).getDetails().getEmail();
        } catch (ClassCastException | WegasNotFoundException e) {
            return "";
        }
    }

    public String getCurrentUserName() {
        try {
            return this.getCurrentUser().getName();
        } catch (WegasNotFoundException ex) {
            return "";
        }
    }

    public String getCurrentRoles() {
        StringBuilder cssClass = new StringBuilder();
        try {
            for (Role r : this.getCurrentUser().getMainAccount().getRoles()) {
                cssClass.append(" wegas-role-");
                cssClass.append(r.getName());
            }
            return cssClass.toString().toLowerCase();
        } catch (WegasNotFoundException e) {
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

    public boolean useYUICDN(){
        return Boolean.valueOf(Helper.getWegasProperty("useYUICDN", "false"));
    }

    public Boolean debugMode() {
        if (debug == null) {
            return Boolean.valueOf(Helper.getWegasProperty("debug", "false"));
        }
        return Boolean.valueOf(this.getDebug());
    }
}
