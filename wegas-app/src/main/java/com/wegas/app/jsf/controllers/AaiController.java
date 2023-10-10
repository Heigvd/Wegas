
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.app.jsf.controllers;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import jakarta.enterprise.context.RequestScoped;
import jakarta.faces.context.ExternalContext;
import jakarta.faces.context.FacesContext;
import jakarta.inject.Inject;
import jakarta.inject.Named;
import jakarta.servlet.http.HttpServletRequest;

/*
 * Copyright (c) AlbaSim, School of Management and Engineering Vaud of Western Switzerland
 * Licensed under the MIT License
 *
 * This is a script for handling AAI login. It's expected to be invoked by HTTP POST method.
 * Data from successful authentication (cookies) are received as POST data.
 * Session cookies are set up here, on the same domain as Wegas itself.
 * The client is then automatically redirected to Wegas.
 *
 * @author jarle.hulaas@heig-vd.ch on 18.03.2017.
 */
@RequestScoped
@Named("aaiController")
public class AaiController {

    @Inject
    private ErrorController errorController;

    private final String jsessionName = "JSESSIONID";

    private final String cookieName = "rememberMe";

    private String cookieValue;
    private String url;
    private String target;
    private String path;

    public String getCookieName() {
        return cookieName;
    }

    public String getCookieValue() {
        return cookieValue;
    }

    public String getUrl() {
        return url;
    }

    public String getTarget() {
        return target;
    }

    public String getPath() {
        return path;
    }

    public void redirect(boolean proceed) {
        ExternalContext externalContext = FacesContext.getCurrentInstance().getExternalContext();

        Object request = externalContext.getRequest();
        if (request instanceof HttpServletRequest) {
            HttpServletRequest httpRequest = (HttpServletRequest) request;

            cookieValue = httpRequest.getParameter(cookieName);
            String jsessionValue = httpRequest.getParameter(jsessionName);
            path = httpRequest.getParameter("PATH");
            url = httpRequest.getRequestURL().toString();
            target = url.substring(0, url.lastIndexOf('/') + 1);

            Map<String, Object> cookieP = new HashMap<>();

            // Session Max Age: must not be zero (or the login won't work).
            // For AAI, it should clearly be less than a year (default Wegas setting).
            Integer sessionMaxAge = 60 * 60 * 24 * 7; // I.e. one week.

            cookieP.put("maxAge", sessionMaxAge);
            cookieP.put("path", path);
            cookieP.put("httpOnly", Boolean.TRUE);
            //Samesite is not supported yet, we have to wait for mojarra 4.0.4
            //cookieP.put("SameSite", "Lax");

            externalContext.addResponseCookie(cookieName, this.cookieValue, cookieP);
            externalContext.addResponseCookie(jsessionName, jsessionValue, cookieP);

            String redirectTo = httpRequest.getParameter("redirect");
            if (redirectTo != null) {
                if (redirectTo.charAt(0) == '/') {
                    target += redirectTo.substring(1);
                } else {
                    target += redirectTo;
                }
            }

            if (proceed) {
                try {
                    externalContext.redirect(target);
                } catch (IOException ex) {
                    errorController.dispatch("Redirect Error " + ex);
                }
            }
        } else {
            errorController.dispatch("Unknown Request Type: " + request);
        }
    }
}
