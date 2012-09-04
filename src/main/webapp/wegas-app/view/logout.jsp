<%@ page language="java" contentType="text/html; charset=ISO-8859-1"
         pageEncoding="ISO-8859-1"%>
<%@ page import="org.apache.shiro.SecurityUtils" %>
<!DOCTYPE html >
<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=ISO-8859-1">
        <title>Log In</title>
        <style type="text/css">
            .yui-g {
                width:300px;
                height:300px;
                display:inline-block;
                float:left;
                padding:10px;
                margin:10px;
                border: 1px outset gray;
                font-family: Arial, Helvetica;
            }
        </style>
    </head>
    <body>
        <div class="yui-g">
            <h1>Logout</h1>
            <% SecurityUtils.getSubject().logout();%>
            You have successfully logged out.
        </div>

    </body>
</html>