 /*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import javax.ejb.EJB;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * LifeCycle Dedicated HttpServlet
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@WebServlet(name = "application-startup", loadOnStartup = 2)
public class ApplicationStartup extends HttpServlet {

    private final Logger logger = LoggerFactory.getLogger(ApplicationStartup.class);

    @EJB
    WebsocketFacade websocketFacade;

    @Override
    public void init(ServletConfig config) throws ServletException {
        websocketFacade.sendLifeCycleEvent(WebsocketFacade.WegasStatus.READY, null);
        super.init(config);
    }

    @Override
    public void destroy() {
        websocketFacade.sendLifeCycleEvent(WebsocketFacade.WegasStatus.DOWN, null);
    }

}
