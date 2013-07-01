/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.facebook;

import java.io.IOException;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.apache.shiro.SecurityUtils;
import org.apache.shiro.authc.AuthenticationException;

/**
 * Simple Facebook Login Handling, doesn't actually do anything except display
 * page confirming login successfull.
 *
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 *
 */
public class FacebookLoginServlet extends HttpServlet {

    private static final long serialVersionUID = 1L;

    /**
     *
     * @param request
     * @param response
     * @throws ServletException
     * @throws IOException
     */
    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
        System.out.println("FacebookLoginServlet getting..");

        String code = request.getParameter("code");
        FacebookToken facebookToken = new FacebookToken(code);
        try {
            SecurityUtils.getSubject().login(facebookToken);
            //response.sendRedirect(response.encodeRedirectURL("index.jsp"));
        } catch (AuthenticationException ae) {
            throw new ServletException(ae);
        }
    }

    /**
     * @param request
     * @param response
     * @throws ServletException
     * @throws IOException
     * @see HttpServlet.Post(HttpServletRequest request, HttpServletResponse)
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException,
            IOException {
        System.out.println("Unexpected doPost ...");
    }
}
