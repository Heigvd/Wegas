/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.servlet;

import java.io.IOException;
import java.net.URLEncoder;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import org.apache.shiro.web.filter.authc.PassThruAuthenticationFilter;
import org.apache.shiro.web.util.WebUtils;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class AuthenticationFilter extends PassThruAuthenticationFilter {

    /**
     *
     * @param request
     * @param response
     * @throws IOException
     */
    @Override
    protected void redirectToLogin(ServletRequest request, ServletResponse response) throws IOException {
        String loginUrl = getLoginUrl();
        loginUrl += "?redirect=" + URLEncoder.encode(WebUtils.getRequestUri((HttpServletRequest) request), "UTF-8");                            //
        WebUtils.issueRedirect(request, response, loginUrl);
    }
}
