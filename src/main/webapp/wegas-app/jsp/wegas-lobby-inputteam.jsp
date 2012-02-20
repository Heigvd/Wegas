<%@page contentType="text/html;" pageEncoding="UTF-8" import="java.util.List, com.wegas.persistence.game.TeamEntity"%>


<h1>Select a team</h1>
Game selected. Please select a team you want to join.
<br /><br />

<form action="#" METHOD="POST"> 
    <select name="teamwish">
        <%
            for (TeamEntity t : (List<TeamEntity>) request.getAttribute("teams")) {
        %>
        <option value="<%= t.getId()%>"><%= t.getName()%></option>
        <%
            }
        %>
    </select>
    <input type="submit" name="test"/>
</form>
