/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.session;

import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpSessionEvent;
import javax.servlet.http.HttpSessionListener;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class SessionListener implements HttpSessionListener {

    /**
     *
     * @param se
     */
    @Override
    public void sessionDestroyed(HttpSessionEvent se) {
        //HttpSession session = se.getSession();
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
