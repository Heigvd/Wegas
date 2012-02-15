<%@page contentType="text/html;" pageEncoding="UTF-8" import="java.util.List, com.wegas.ejb.GameManager, com.wegas.persistence.game.TeamEntity, com.wegas.persistence.game.GameEntity, com.wegas.persistence.users.UserEntity, com.wegas.ejb.UserManager, com.wegas.ejb.GameModelManager, javax.naming.*, org.apache.shiro.subject.Subject, org.apache.shiro.SecurityUtils, com.wegas.ejb.UserManager"%>
<%!    private GameManager gm = null;
    private GameEntity game = null;

    public void jspInit() {
        try {
            InitialContext ic = new InitialContext();
            gm = (GameManager) new InitialContext().lookup("java:module/GameManagerBean");
        } catch (Exception ex) {
            System.out.println("Error:" + ex.getMessage());
        }
    }

    public void jspDestroy() {
    }
%>
<html>
    <body>
        Game selected. Please select a team you want to join.
        <br /><br />

        <form action="#" METHOD="POST"> 
            <select name="teamwish">
                <%
                    game = gm.getGameByToken(request.getParameter("gametoken"));
                    //     out.println(game);
                    out.println(game.getTeams());
                    for (TeamEntity t : game.getTeams()) {
                %>
                <option value="<%= t.getId()%>"><%= t.getName()%></option>
                <%
                    }
                %>
            </select>
            <input type="submit" name="test"/>
        </form>
    </body>
</html>
