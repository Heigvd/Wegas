/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.servlet;

import com.hazelcast.cluster.Member;
import com.hazelcast.core.HazelcastInstance;
import com.wegas.core.async.PopulatorScheduler;
import com.wegas.core.ejb.ApplicationLifecycle;
import com.wegas.core.ejb.MetricsFacade;
import com.wegas.core.ejb.WebsocketFacade;
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

    @Inject
    private WebsocketFacade websocketFacade;

    @Inject
    private ApplicationLifecycle applicationLifecycle;

    @Inject
    private PopulatorScheduler populatorScheduler;

    @Inject
    private HazelcastInstance hzInstance;

    @Inject
    private MetricsFacade metricsFacade;

    @Override
    public void init(ServletConfig config) throws ServletException {
        super.init(config);
        logger.info("Servlet Startup");

        // read metrics once to register them
        metricsFacade.getOnlineUserCounter();
        metricsFacade.getInternalSize();
        metricsFacade.getHzSize();

        websocketFacade.getOnlineUsers();

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
        //hzInstance.getLifecycleService().addLifecycleListener(applicationLifecycle);

        /*
         * Inform client webapp is running
         */
        applicationLifecycle.sendWegasReadyEvent();

        populatorScheduler.startAllLocalPopulators();
    }

    @Override
    public void destroy() {
        logger.error("DESTROY APPLICATION SERVLET");

        populatorScheduler.cancelLocalPopulating();

        applicationLifecycle.hZshutdown();

        // hZinstance is not in cluster anymore here, no way to detect if this instance is the last one
        int count = applicationLifecycle.countMembers();
        logger.info("Servlet Destroy: {}", count);

        /*
         * is the last instance ?
         */
        if (count <= 1) {
            // inform clients webapp is down
            applicationLifecycle.sendWegasDownEvent();
        }
    }
}
