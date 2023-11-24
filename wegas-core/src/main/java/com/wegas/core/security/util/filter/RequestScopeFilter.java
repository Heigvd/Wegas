/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util.filter;

import java.io.IOException;
import java.util.Enumeration;
import jakarta.servlet.DispatcherType;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.annotation.WebFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Request headers logger
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@WebFilter(filterName = "RequestScopeFilter", urlPatterns = {"/*"}, dispatcherTypes = {DispatcherType.REQUEST})
public class RequestScopeFilter implements Filter {

    private static final Logger logger = LoggerFactory.getLogger(RequestScopeFilter.class);

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        // noop
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain) throws IOException, ServletException {
        if (request instanceof HttpServletRequest && response instanceof HttpServletResponse) {
            HttpServletRequest r = (HttpServletRequest) request;

            if (logger.isTraceEnabled()) {
                logger.trace("TRACE REQUEST : {}", r.getRequestURI());

                Enumeration<String> headerNames = r.getHeaderNames();
                while (headerNames.hasMoreElements()) {
                    String key = headerNames.nextElement();

                    if (!key.equals("cookie")) { // do no print any cookies
                        String value = r.getHeader(key);
                        logger.trace(" * {}: {}", key, value);
                    } else {
                        logger.trace(" * Cookie: *************");
                    }
                }
            }
        }
        chain.doFilter(request, response);
    }

    @Override
    public void destroy() {
        // noop
    }
}
