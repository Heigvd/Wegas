/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.tools;

import com.albasim.wegas.ejb.Dispatcher;
import javax.ejb.EJB;
import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

/**
 *
 * @author maxence
 */
public class SessionListener implements HttpSessionListener {
     
    @EJB Dispatcher dispatcher;

    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        HttpSession session = se.getSession();
        dispatcher.destroyAllSession(session.getId());
    }


    @Override
    public void sessionCreated(HttpSessionEvent se) {
    }
}
