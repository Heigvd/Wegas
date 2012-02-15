<%@page contentType="text/html" pageEncoding="UTF-8"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"
    "http://www.w3.org/TR/html4/loose.dtd">

<html>
    <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <title>JSP Page</title>
    </head>
    <body>
        <h1>Wegas</h1>

        <em>POST the following to /rs/gm</em>
        <pre>
{
    "@class": "GameModel",
    "name": "Project Management Game","id":"1",
    "teams":[{
        "@class": "Team", "name":"Les rouges",
        "users": [{
             "@class": "User",
             "name": "Francois"
        },
        {
             "@class": "User",
             "name": "Dominique"
        }]
    },{
        "@class": "Team", "name":"Les bleus",
        "users": [{
             "@class": "User",
             "name": "Francois"
        },
        {
             "@class": "User",
             "name": "Dominique"
        }]
    }]

}
        </pre>
    </body>
</html>
