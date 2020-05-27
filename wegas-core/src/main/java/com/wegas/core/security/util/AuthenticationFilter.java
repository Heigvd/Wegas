/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.wegas.core.Helper;
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
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class AuthenticationFilter extends PassThruAuthenticationFilter {

    /**
     * Extend to authorize remembered login
     * <p>
     * edition if credentials were not give for the current session.
     *
     * @param request
     * @param response
     * @param mappedValue
     *
     * @return true if current user is already logged in or if an automatic
     *         guest login has been done
     */
    @Override
    protected boolean isAccessAllowed(ServletRequest request, ServletResponse response, Object mappedValue) {
        // @todo It should not be authorized to do sensitive operations like pwd
        Subject subject = getSubject(request, response);
        return Helper.isLoggedIn(subject);
    }

    /**
     *
     * @param request
     * @param response
     *
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
