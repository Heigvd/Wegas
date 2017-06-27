/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.servlet;

import com.hazelcast.core.HazelcastInstance;
import com.hazelcast.core.Member;
import com.wegas.core.ejb.ApplicationLifecycle;
import com.wegas.core.ejb.WebsocketFacade;
import javax.ejb.EJB;
import javax.inject.Inject;
import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * LifeCycle Dedicated HttpServlet
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 * @see ApplicationLifecycle
 */
@WebServlet(name = "application-startup", loadOnStartup = 2)
public class ApplicationStartup extends HttpServlet {

    private static final long serialVersionUID = 1627669174708657546L;

    private final Logger logger = LoggerFactory.getLogger(ApplicationStartup.class);

    @EJB
    WebsocketFacade websocketFacade;

    @Inject
    private ApplicationLifecycle applicationLifecycle;

    @Inject
    private HazelcastInstance hzInstance;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        logger.info("Servlet Startup");

        /*
         * init member list
         */
        for (Member member : hzInstance.getCluster().getMembers()) {
            applicationLifecycle.addMember(member.getUuid());
        }
        /*
         * Register this instance to other members
         */
        applicationLifecycle.sendInstanceReadyEvent(hzInstance.getCluster().getLocalMember().getUuid());

        /*
         * set the membership listener up
         */
        hzInstance.getCluster().addMembershipListener(applicationLifecycle);
        hzInstance.getLifecycleService().addLifecycleListener(applicationLifecycle);

        /*
         * Inform client webapp is running
         */
        applicationLifecycle.sendWegasReadyEvent();
    }

    @Override
    public void destroy() {
        // hZinstance is not in cluster anymore here, no way to detect if this instance is the last one
        int count = applicationLifecycle.countMembers();
        logger.info("Servlet Destroy: " + count);

        /*
         * is the last instance ? 
         */
        if (count <= 1) {
            // inform clients webapp is down
            applicationLifecycle.sendWegasDownEvent();
        }
    }
}
