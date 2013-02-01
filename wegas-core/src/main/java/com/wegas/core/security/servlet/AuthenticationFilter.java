/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.servlet;

import java.io.IOException;
import java.net.URLEncoder;
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
     * Extend to authorie remembered login
     *
     * @todo It should not be authorized to do sensitive operations like pwd edition
     * if credentials were not give for the current session.
     * @param request
     * @param response
     * @param mappedValue
     * @return
     */
    @Override
    protected boolean isAccessAllowed(ServletRequest request, ServletResponse response, Object mappedValue) {
        Subject subject = getSubject(request, response);
        return subject.isAuthenticated()|| subject.isRemembered();
    }
    /**
     *
     * @param request
     * @param response
     * @throws IOException
     */
    @Override
    protected void redirectToLogin(ServletRequest request, ServletResponse response) throws IOException {
        String loginUrl = getLoginUrl();
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String url = WebUtils.getRequestUri(httpRequest);
        if (httpRequest.getQueryString() != null) {
            url += "?" + httpRequest.getQueryString();
        }
        loginUrl += "?redirect=" + URLEncoder.encode(url, "UTF-8");
        WebUtils.issueRedirect(request, response, loginUrl);
    }
}
