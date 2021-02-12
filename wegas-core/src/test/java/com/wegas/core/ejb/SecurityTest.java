/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.client.WegasAccessDenied;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.security.persistence.Role;
import com.wegas.core.security.persistence.User;
import com.wegas.test.arquillian.AbstractArquillianTest;
import java.util.Collection;
import javax.ejb.EJBException;
import org.apache.shiro.authc.AuthenticationException;
import org.jboss.arquillian.test.spi.ArquillianProxyException;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;

/**
 *
 * @author maxence
 */
public class SecurityTest extends AbstractArquillianTest {

    @Test
    public void testPrivilegeEscalation_autoGrantAdmin() throws WegasNoResultException {
        Assertions.assertThrows(EJBException.class, () -> {
            WegasUser guestLogin = guestLogin();

            userFacade.addRole(guestLogin.getId(), roleFacade.findByName("Administrator").getId());

            gameModelFacade.findAll();
            User find = userFacade.find(guestLogin.getId());
        });
    }

    @Test
    public void testPrivilegeEscalation_autoGrantTrainer() throws WegasNoResultException, Throwable {
        Assertions.assertThrows(EJBException.class, () -> {
            WegasUser guestLogin = guestLogin();
            userFacade.addRole(guestLogin.getId(), roleFacade.findByName("Trainer").getId());
        });
    }

    /**
     * A trainer join its own game as player. Then, as admin join the game as player. Trainer tries
     * to copy admin membership
     *
     * @throws WegasNoResultException
     */
    @Test
    public void testPrivilegeEscalation_stealTeamMateRoles() throws WegasNoResultException {
        Assertions.assertThrows(WegasAccessDenied.class, () -> {
            login(admin);
            Player adminPlayer = gameFacade.joinTeam(team.getId(), admin.getId(), null);
            Long rootId = adminPlayer.getUser().getId();

            login(user);

            String script = "var admin = gameModel.getPlayers().stream().filter(function(p){return p.getUser() && p.getUser().getId() == " + rootId + "}).findAny().get();\n"
                + "self.getUser().setRoles(admin.getUser().getRoles());\n";

            Object eval = scriptFacade.eval(player, new Script("JavaScript", script), null);
            logger.error("Eval: {}", eval);
        });
    }

    /**
     * A trainer join its own game as player. Then, as admin join the game as player. Trainer tries
     * to copy admin membership by adding one specific role to its own list
     *
     * @throws WegasNoResultException
     */
    @Test
    public void testPrivilegeEscalation_stealTeamMateRoles_v2() throws WegasNoResultException {
        login(admin);
        Player adminPlayer = gameFacade.joinTeam(team.getId(), admin.getId(), null);
        Long rootId = adminPlayer.getUser().getId();

        login(user);

        String script = "var admin = gameModel.getPlayers().stream().filter(function(p){return p.getUser() && p.getUser().getId() == " + rootId + "}).findAny().get();\n"
            + "var aRole = admin.getUser().getRoles().get(0);\n"
            + "print('Role: ' +aRole);\n"
            + "self.getUser().getRoles().add(aRole);\n";

        Collection<Role> rolesBefore = userFacade.find(user.getId()).getRoles();

        Object eval = scriptFacade.eval(player, new Script("JavaScript", script), null);
        logger.error("Eval: {}", eval);

        Collection<Role> rolesAfter = userFacade.find(user.getId()).getRoles();

        Assertions.assertEquals(rolesBefore.size(), rolesAfter.size());
    }

    /**
     * A trainer join its own game as player. Then, as admin join the game as player. Trainer tries
     * to copy admin membership by adding one specific role to its own list
     *
     */
    @Test
    public void testPrivilegeEscalation_stealTeamMateRoles_v3() {
        Assertions.assertThrows(WegasAccessDenied.class, () -> {
            login(admin);
            Player adminPlayer = gameFacade.joinTeam(team.getId(), admin.getId(), null);
            Long rootId = adminPlayer.getUser().getId();

            login(user);

            String script = "var admin = gameModel.getPlayers().stream().filter(function(p){return p.getUser() && p.getUser().getId() == " + rootId + "}).findAny().get();\n"
                + "var aRole = admin.getUser().getRoles().get(0);\n"
                + "print('Role: ' +aRole);\n"
                + "self.getUser().addRole(aRole);\n";

            Object eval = scriptFacade.eval(player, new Script("JavaScript", script), null);
            logger.error("Eval: {}", eval);
        });
    }

    @Test
    public void testQuit() {
        Assertions.assertThrows(WegasScriptException.class, () -> {
            String script = "quit();";
            scriptFacade.eval(player, new Script("JavaScript", script), null);
        });
    }

    @Test
    public void testEntityManagerIsNotAccessible() {
        Assertions.assertThrows(ArquillianProxyException.class, () -> {
            String password = "SuperSecure";

            WegasUser hacker = signup("hacker@local", password);
            login(hacker);

            String script = "RequestManager.getEntityManager();";

            Object eval = scriptFacade.eval(player, new Script("JavaScript", script), null);
            logger.error("Eval: {}", eval);
        });
    }

    @Test
    public void testJPAQuery() {
        Assertions.assertThrows(AuthenticationException.class, () -> {
            String password = "SuperSecure";

            WegasUser hacker = signup("hacker@local", password);
            login(hacker);

            Player myPlayer = gameFacade.joinTeam(team.getId(), hacker.getId(), null);

            String script = "try{";

            script += "currentUserId = RequestManager.getCurrentUser().getId();";
            script += "query = RequestManager.getEntityManager().createQuery('SELECT aa.shadow.salt, aa.shadow.passwordHex FROM JpaAccount aa where aa.user.id = ' + currentUserId);";
            script += "result = Java.from(query.getResultList());";

            script += "salt = result[0][0];";
            script += "hex = result[0][1];";

            script += "sql2 = 'UPDATE JpaAccount aa SET aa.shadow.salt = \"' + salt + '\", aa.shadow.passwordHex=\"' + hex + '\" WHERE aa.user.id = 1';";
            script += "query2 = RequestManager.getEntityManager().createQuery(sql2);";
            script += "print(salt);print(hex);print(query2);";
            script += "query2.executeUpdate();";
            script += "} catch (e) {print(e);}";

            scriptFacade.eval(myPlayer, new Script("JavaScript", script), null);

            login("root", password);
            User currentUser = userFacade.getCurrentUser();
        });
    }

    @Test
    public void grantGameRightToPlayer() {
        Assertions.assertThrows(ArquillianProxyException.class, () -> {
            login(user);
            userFacade.addTrainerToGame(user.getId(), game.getId());
        });
    }

    @Test
    public void testSu() {
        login(user);
        String script = "try{";

        script += "var subject = org.apache.shiro.SecurityUtils.getSubject();";
        script += "var token = new org.apache.shiro.subject.SimplePrincipalCollection(new java.lang.Long(1), 'jpaRealm');";
        script += "subject.runAs(token);";
        script += "} catch (e) {print(e);}";

        scriptFacade.eval(player, new Script("JavaScript", script), null);

        logger.error("CURRENT: {}", requestFacade.getCurrentUser().getId());
        Assertions.assertEquals(user.getUser(), requestFacade.getCurrentUser()); // assert su has failed
    }

    @Test
    public void testReadRessources() {
        Assertions.assertThrows(WegasScriptException.class, () -> {
            login(user);
            String script = "new java.io.BufferedReader(new java.io.InputStreamReader(Variable.getClass().getClassLoader().getResourceAsStream(\"wegas.properties\")))\n"
                + "            .lines().collect(java.util.stream.Collectors.joining(\"\\n\"));";

            Object eval = scriptFacade.eval(player, new Script("JavaScript", script), null);
            logger.error("Eval: {}", eval);
        });
    }

    @Test
    public void testRuntime() {
        Assertions.assertThrows(WegasScriptException.class, () -> {
            login(user);
            String script = "java.lang.Runtime.getRuntime().exec('ls /');";

            scriptFacade.eval(player, new Script("JavaScript", script), null);
        });
    }

    @Test
    public void testSystem() {
        Assertions.assertThrows(WegasScriptException.class, () -> {
            login(user);
            String script = "java.lang.System.getProperties();";
            scriptFacade.eval(player, new Script("JavaScript", script), null);
        });
    }

    @Test
    public void testThread() {
        Assertions.assertThrows(WegasScriptException.class, () -> {
            login(user);
            String script = "java.lang.Thread.currentThread().interrupt();";
            scriptFacade.eval(player, new Script("JavaScript", script), null);
        });
    }

    @Test
    public void testReadShadow() {
        login(user);
        String script = "try{";
        script += "users = Java.from(RequestManager.getCurrentUser().getRoles().get(0).getUsers());\n"
            + "users.map(function(user){\n"
            + "    return user.getMainAccount().getShadow()\n"
            + "});";
        script += "} catch (e) {print(e);}";

        scriptFacade.eval(player, new Script("JavaScript", script), null);

        logger.error("CURRENT: {}", requestFacade.getCurrentUser().getId());
        Assertions.assertEquals(user.getUser(), requestFacade.getCurrentUser()); // assert su has failed
    }

    @Test
    public void testJavaNio() {
        Assertions.assertThrows(WegasScriptException.class, () -> {
            login(user);
            String script = "var dir = java.nio.file.Paths.get('.');\n"
                + "java.nio.file.Files.list(dir).map(function(p) { return p.toAbsolutePath().toString() }).collect(java.util.stream.Collectors.joining(\";\"));";
            Object result = scriptFacade.eval(player, new Script("JavaScript", script), null);

            logger.error("result: {}", result);
        });
    }

    @Test
    public void testProcessBuilder() {
        Assertions.assertThrows(WegasScriptException.class, () -> {
            login(user);
            String script = "var Collectors = Java.type('java.util.stream.Collectors');\n"
                + "    var ProcessBuilder = Java.type('java.lang.ProcessBuilder');\n"
                + "    var p = new ProcessBuilder(\"java\");\n"
                + "    var env = p.environment();\n"
                + "    res = env.keySet().stream().map(function(key) { return key + '=' + env.get(key); }).collect(Collectors.joining(', ', '{', '}'));\n";
            Object result = scriptFacade.eval(player, new Script("JavaScript", script), null);

            logger.error("result: {}", result);
        });
    }
}
