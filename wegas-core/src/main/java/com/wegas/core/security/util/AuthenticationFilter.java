/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.wegas.core.Helper;
import com.wegas.core.security.ejb.UserFacade;
import java.io.IOException;
import java.net.URLEncoder;
import javax.naming.NamingException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import org.apache.shiro.subject.Subject;
import org.apache.shiro.web.filter.authc.PassThruAuthenticationFilter;
import org.apache.shiro.web.util.WebUtils;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class AuthenticationFilter extends PassThruAuthenticationFilter {

    /**
     * Extend to authorize remembered login
     *
     * @todo It should not be authorized to do sensitive operations like pwd
     * edition if credentials were not give for the current session.
     * @param request
     * @param response
     * @param mappedValue
     * @return
     */
    @Override
    protected boolean isAccessAllowed(ServletRequest request, ServletResponse response, Object mappedValue) {
        Subject subject = getSubject(request, response);
        if (subject.isAuthenticated() || subject.isRemembered()) {
            return true;
        } else if (request.getParameter("al") != null
                && Helper.getWegasProperty("guestallowed").equals("true")) {    // Automatic guest login
            try {
                Helper.lookupBy(UserFacade.class).guestLogin();
                return true;
            } catch (NamingException ex) {
                // Gotcha: log this
            }
        }
        return false;
    }

    /**
     *
     * @param request
     * @param response
     * @throws IOException
     */
    @Override
    protected void redirectToLogin(ServletRequest request, ServletResponse response) throws IOException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;

        String url = WebUtils.getRequestUri(httpRequest);
        if (httpRequest.getQueryString() != null) {
            url += "?" + httpRequest.getQueryString();
        }
        WebUtils.issueRedirect(request, response,
                getLoginUrl() + "?redirect=" + URLEncoder.encode(url, "UTF-8"));
    }
}
