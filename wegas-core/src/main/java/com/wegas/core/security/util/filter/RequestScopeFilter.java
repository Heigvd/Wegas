/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util.filter;

import com.wegas.core.security.util.*;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Enumeration;
import javax.servlet.DispatcherType;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.annotation.WebFilter;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * CacheControl No-Cache for static content
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@WebFilter(filterName = "CacheControlFilter", urlPatterns = {"/*"}, dispatcherTypes = {DispatcherType.REQUEST})
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
