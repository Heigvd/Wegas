<%@page import="com.wegas.core.security.realm.JNDIAndSaltAwareJdbcRealm, org.apache.shiro.SecurityUtils, org.apache.shiro.mgt.RealmSecurityManager, org.apache.shiro.realm.Realm, java.util.Collection"%>
<%@page language="java" contentType="text/html; charset=utf-8" pageEncoding="utf-8"%>
<%@ taglib uri="http://java.sun.com/jstl/core" prefix="c" %>
<%!    JNDIAndSaltAwareJdbcRealm realm = null;
%>
<%
    for (Realm r : ( (RealmSecurityManager) SecurityUtils.getSecurityManager() ).getRealms()) {
        if (r instanceof JNDIAndSaltAwareJdbcRealm) {
            realm = (JNDIAndSaltAwareJdbcRealm) r;
        }
    }

    String op = (String) request.getParameter("submit");
    boolean userCreated = false;
    if (op != null && op.equals("CreateUser")) {
        userCreated = true;
        System.out.println("[wegas-login.jsp]Creating new user");
        realm.createUser((String) request.getParameter("createemail"), (String) request.getParameter("createpass"));
    }
%>
<!DOCTYPE html >
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
        <title>Log In</title>
        <style type="text/css">
            .yui-g {
                width:300px;
                height:300px;
                display:inline-block;
                float:left;
                padding:10px;
                margin :10px;
                border: 1px outset gray;
                font-family: Arial, Helvetica;
            }
        </style>
    </head>
    <body>
        <div class="yui-g">
            <h1>Login</h1>
            <%
                String errorDescription = (String) request.getAttribute("shiroLoginFailure");
                if (errorDescription != null) {
            %>
            Login attempt was unsuccessful: <%=errorDescription%>
            <%
                }
            %>
            <form name="loginform" action="<c:url value="/wegas-login"/>" method="post">
                <table align="left" border="0" cellspacing="0" cellpadding="3">
                    <tr>
                        <td>Email:</td>
                        <td><input type="text" name="user" maxlength="30"></td>
                    </tr>
                    <tr>
                        <td>Password:</td>
                        <td><input type="password" name="pass" maxlength="30"></td>
                    </tr>
                    <tr>
                        <td colspan="2" align="left"><input type="checkbox" name="remember"><font size="2">Remember Me</font></td>
                    </tr>
                    <tr>
                        <td colspan="2" align="right"><input type="submit" name="submit" value="Login"></td>
                    </tr>
                </table>
            </form>
        </div>
        <div class="yui-g">

            <h1>Create an account</h1>
            <% if (userCreated) {%>
            You can now login using your new username.
            <% } else {%>

            <form name="createAccountForm" action="<c:url value="/wegas-signup"/>" method="post">
                <table align="left" border="0" cellspacing="0" cellpadding="3">

                    <tr>
                        <td>Email:</td>
                        <td><input type="text" name="createemail" maxlength="30"></td>
                    </tr>
                    <tr>
                        <td>Password:</td>
                        <td><input type="password" name="createpass" maxlength="30"></td>
                    </tr>
                    <tr>
                        <td colspan="2" align="right"><input type="submit" name="submit" value="CreateUser"></td>
                    </tr>
                </table>
            </form>
            <% }%>
        </div>

    </body>
</html>