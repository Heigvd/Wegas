/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.ejb;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.metrics.MetricUnits;
import org.eclipse.microprofile.metrics.annotation.Gauge;

/**
 * CDI Singleton to group Gauge metrics.
 *
 * @author maxence
 */
@ApplicationScoped
public class MetricsFacade {

    @Inject
    private ApplicationLifecycle applicationLifecycle;

    @Inject
    private WebsocketFacade websocketFacade;

    @Inject
    private ScriptFacade scriptFacade;

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

    @Gauge(name = "serverscript_cache_size", unit = MetricUnits.NONE, absolute = true)
    public int getServerScriptCacheSIze() {
        return scriptFacade.getCacheSize();
    }
}
