/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.session;

import javax.servlet.http.HttpSessionEvent;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
public class SessionListener /*implements HttpSessionListener*/ {

    /**
     *
     * @param se
     */
    //@Override
    public void sessionDestroyed(HttpSessionEvent se) {
        //HttpSession session = se.getSession();
        //dispatcher.destroyAllSession(session.getId());
    }

    /**
     *
     * @param se
     */
    //@Override
    public void sessionCreated(HttpSessionEvent se) {
    }
}
