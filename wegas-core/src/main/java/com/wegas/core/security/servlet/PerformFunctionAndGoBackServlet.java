/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.servlet;

import java.io.IOException;
import javax.servlet.Servlet;
import javax.servlet.ServletException;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 *
 * SAMPLE FILE NOT IN USE
 *
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class PerformFunctionAndGoBackServlet extends HttpServlet implements Servlet {

    private static transient final Logger log = LoggerFactory.getLogger(PerformFunctionAndGoBackServlet.class);
    private static final long serialVersionUID = -7896114563632467947L;

    /**
     *
     * @param req
     * @param resp
     * @throws ServletException
     * @throws IOException
     */
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws ServletException, IOException {
        doPost(req, resp);
    }

    /**
     *
     * @param request
     * @param response
     * @throws ServletException
     * @throws IOException
     */
    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
//        String action = request.getParameter("action");
//        String actionResult = performAction(action);
//        request.setAttribute("actionResultMessage", actionResult);
//
//        // forward the request and response back to original page
//        String originalPage = request.getParameter("originalPage");
//        RequestDispatcher dispatcher = getServletContext().getRequestDispatcher(originalPage);
//        dispatcher.forward(request, response);
    }
//
//    private String performAction(String actionName) {
//        try {
//            Actions action = findAction(actionName);
//            String result = action == null ? null : action.doIt();
//            log.debug("Performed function with result: " + result);
//            return result;
//        }
//        catch (ShiroException ex) {
//            log.debug("Function failed with " + ex.getMessage() + " message.");
//            return "Error: " + ex.getMessage();
//        }
//    }
//
//    private Actions findAction(String actionName) {
//        if (actionName == null) {
//            return null;
//        }
//
//        Actions[] values = Actions.values();
//
//        for (Actions action : values) {
//            if (actionName.equals(action.getName())) {
//                return action;
//            }
//        }
//        return null;
//    }

    /**
     *
     * @param request
     * @return
     */
    public String getUrl(HttpServletRequest request) {
        String reqUrl = request.getRequestURL().toString();
        String queryString = request.getQueryString(); // d=789
        if (queryString != null) {
            reqUrl += "?" + queryString;
        }
        return reqUrl;
    }
}
