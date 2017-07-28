/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.test.AbstractEJBTest;
import com.wegas.core.exception.internal.WegasNoResultException;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.security.persistence.User;
import javax.ejb.EJBException;
import junit.framework.Assert;
import org.apache.shiro.authc.AuthenticationException;
import org.junit.Test;

/**
 *
 * @author maxence
 */
public class SecurityTest extends AbstractEJBTest {

    @Test(expected = EJBException.class)
    public void testPrivilegeEscalation_autoGrantAdmin() throws WegasNoResultException {
        WegasUser guestLogin = guestLogin();

        userFacade.addRole(guestLogin.getId(), roleFacade.findByName("Administrator").getId());

        gameModelFacade.findAll();
        User find = userFacade.find(guestLogin.getId());
    }

    @Test(expected = EJBException.class)
    public void testPrivilegeEscalation_autoGrantTrainer() throws WegasNoResultException, Throwable {
        WegasUser guestLogin = guestLogin();
        userFacade.addRole(guestLogin.getId(), roleFacade.findByName("Trainer").getId());
    }

    @Test(expected = WegasScriptException.class)
    public void testQuit() {
        String script = "quit();";
        scriptFacade.eval(player, new Script("JavaScript", script), null);
    }

    @Test(expected = AuthenticationException.class)
    public void testJPAQuery() {
        String password = "SuperSecure";

        WegasUser hacker = signup("hacker@local", password);
        login(hacker);

        String script = "try{";

        script += "currentUserId = RequestManager.getCurrentUser().getId();";
        script += "query = RequestManager.getEntityManager().createQuery('SELECT aa.salt, aa.passwordHex FROM JpaAccount aa where aa.user.id = ' + currentUserId);";
        script += "result = Java.from(query.getResultList());";

        script += "salt = result[0][0];";
        script += "hex = result[0][1];";

        script += "sql2 = 'UPDATE JpaAccount aa SET aa.salt = \"' + salt + '\", aa.passwordHex=\"' + hex + '\" WHERE aa.user.id = 1';";
        script += "query2 = RequestManager.getEntityManager().createQuery(sql2);";
        script += "print(salt);print(hex);print(query2);";
        script += "query2.executeUpdate();";
        script += "} catch (e) {print(e);}";

        scriptFacade.eval(player, new Script("JavaScript", script), null);

        login("root", password);
        User currentUser = userFacade.getCurrentUser();
    }

    @Test(expected = EJBException.class)
    public void grantGameRightToPlayer() {
        login(user);
        userFacade.addTrainerToGame(user.getId(), game.getId());
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

        logger.error("CURRENT: {}", requestManager.getCurrentUser().getId() );
        Assert.assertEquals(user.getUser(), requestManager.getCurrentUser()); // assert su has failed
    }

    

}
