/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import javax.enterprise.context.ApplicationScoped;
import javax.inject.Inject;
import org.eclipse.microprofile.metrics.MetricUnits;
import org.eclipse.microprofile.metrics.annotation.Gauge;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * CDI Singleton to group Gauge metrics.
 *
 * @author maxence
 */
@ApplicationScoped
public class MetricsFacade {

    private final Logger logger = LoggerFactory.getLogger(MetricsFacade.class);

    @Inject
    private ApplicationLifecycle applicationLifecycle;

    @Inject
    private WebsocketFacade websocketFacade;

    @Gauge(name = "online_users", unit = MetricUnits.NONE, absolute = true)
    public int getOnlineUserCounter() {
        return websocketFacade.getOnlineUserCount();
    }

    @Gauge(name = "internalcluster_size", unit = MetricUnits.NONE, absolute = true)
    public int getInternalSize() {
        return applicationLifecycle.countMembers();
    }

    @Gauge(name = "cluster_size", unit = MetricUnits.NONE, absolute = true)
    public int getHzSize() {
        return applicationLifecycle.getHzSize();
    }
}
