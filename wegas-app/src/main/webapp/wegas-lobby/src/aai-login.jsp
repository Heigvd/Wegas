<%@ page import="java.util.*" %>
<%
/*
 * Copyright (c) AlbaSim, School of Business and Engineering of Western Switzerland
 * Licensed under the MIT License
 *
 * This is a script for handling AAI login. It's expected to be invoked by HTTP POST method.
 * Data from successful authentication (cookies) are received as POST data.
 * Session cookies are set up here, on the same domain as Wegas itself.
 * The client is then automatically redirected to Wegas.
 *
 * @author jarle.hulaas@heig-vd.ch on 18.03.2017.
 */

    final String cookieName = "rememberMe";
    final String jsessionName = "JSESSIONID";

    // Session Max Age: must not be zero (or the login won't work).
    // For AAI, it should clearly be less than a year (default Wegas setting).
    final int sessionMaxAge = 60*60*24*7; // I.e. one week.

    String cookieValue = request.getParameter(cookieName);
    String jsessionValue = request.getParameter(jsessionName);
    String path = request.getParameter("PATH");
    String url = request.getRequestURL().toString();
    String target = url.substring(0, url.lastIndexOf('/')+1);

    Cookie c = new Cookie(cookieName, cookieValue);
    c.setMaxAge(sessionMaxAge);
    c.setPath(path);
    c.setHttpOnly(true);
    response.addCookie(c);

    c = new Cookie(jsessionName, jsessionValue);
    c.setMaxAge(sessionMaxAge);
    c.setPath(path);
    c.setHttpOnly(true);
    response.addCookie(c);

    String redirectTo = request.getParameter("redirect");
    if (redirectTo != null){
        target += "?redirect=" + redirectTo;
    }

    response.sendRedirect(target);

    // Everything below gets skipped when the above redirect is active !!!
    // Keep it only for debugging purposes.
%>

<%@ page contentType="text/html; charset=UTF-8" %>
<!doctype html>
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
        <title>Wegas AAI login</title>
    </head>
    <body>
        <%
            out.println("\t " + cookieName + "=" + cookieValue);
            out.println("\t Path=" + path);
            out.println("\t URL=" + url);
            out.println("\t target=" + target);
        %>

    </body>
</html>
