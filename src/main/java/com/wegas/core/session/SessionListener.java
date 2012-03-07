/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.session;

import javax.ejb.EJB;
import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

/**
 *
 * @author maxence
 */
public class SessionListener implements HttpSessionListener {
     

    /**
     * 
     * @param se
     */
    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        HttpSession session = se.getSession();
       //dispatcher.destroyAllSession(session.getId());
    }

    /**
     * 
     * @param se
     */
    @Override
    public void sessionCreated(HttpSessionEvent se) {
    }
}
