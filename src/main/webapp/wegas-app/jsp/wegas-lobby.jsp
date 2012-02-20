<%@page import="com.wegas.persistence.game.PlayerEntity"%>
<%@page contentType="text/html;" pageEncoding="UTF-8" import="com.wegas.ejb.TeamManager,java.util.List, com.wegas.ejb.GameManager, com.wegas.persistence.game.TeamEntity, com.wegas.persistence.game.GameEntity, com.wegas.persistence.users.UserEntity, com.wegas.ejb.UserManager, com.wegas.ejb.GameModelManager, javax.naming.*, org.apache.shiro.subject.Subject, org.apache.shiro.SecurityUtils, com.wegas.ejb.UserManager"%>
<%!    private UserManager um = null;
    private GameManager gm = null;
    private TeamManager tm = null;
    private GameEntity game = null;
    private PlayerEntity cPlayer = null;
    private String view = "app";
    float result = 0;

    public void jspInit() {
        try {
            InitialContext ic = new InitialContext();
            um = (UserManager) new InitialContext().lookup("java:module/UserManagerBean");
            tm = (TeamManager) new InitialContext().lookup("java:module/TeamManagerBean");
            gm = (GameManager) new InitialContext().lookup("java:module/GameManagerBean");
        }
        catch (Exception ex) {
            System.out.println("Error:" + ex.getMessage());
        }
    }

    public void jspDestroy() {
        um = null;
    }
%>
<%
    Subject subject = SecurityUtils.getSubject();
    UserEntity u = um.getUserByPrincipal(subject.getPrincipal().toString());
    if (u == null) {                                                            // The current user does not exist, we create one.
        u = new UserEntity();
        u.setName(subject.getPrincipal().toString());
        um.createUser(u);
    }

    if (u.getPlayers().isEmpty()) {                                             // The player is not part of any team
        if (request.getParameter("teamwish") != null) {                         // User has not selected a game
            view = "input-teamwish";
            tm.addUser(new Long(request.getParameter("teamwish")), u.getId());
            out.println("teamwish" + request.getParameter("teamwish"));
            view = "app";
        } else if (request.getParameter("gametoken") != null) {                 // User has not selected a team
            game = gm.getGameByToken(request.getParameter("gametoken"));
            if (game == null) {
                out.println("This game does not exist. <br /><br />");
                view = "input-gametoken";
            } else {
                view = "input-team";
            }
        } else {
            view = "input-gametoken";
        }
    } else {                                                                        // Player is already registered to a team, we display the app
        view = "app";
        cPlayer = u.getPlayers().get(0);
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
                margin:10px;
                border: 1px outset gray;
                font-family: Arial, Helvetica;
            }
        </style>
    </head>
    <body>
        <div class="yui-g">
            <%
                if (view.equals("app")) {
            %>
            <jsp:forward page="wegas-app" >
                <jsp:param name="playerId" value="<%= cPlayer.getId() %>" /> 
            </jsp:forward>
            <%    } else if (view.equals("input-team")) {
            %>
            <jsp:include page="wegas-app/jsp/input-team.jsp"  />
            <%    } else if (view.equals("input-gametoken")) {
            %>
            <jsp:include page="wegas-app/jsp/input-gametoken.jsp" />
            <%}
            %>
        </div>

    </body>
</html>