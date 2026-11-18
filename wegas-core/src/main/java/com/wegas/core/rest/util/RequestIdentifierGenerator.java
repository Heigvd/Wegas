/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import jakarta.ejb.Singleton;
import jakarta.inject.Inject;
import java.util.concurrent.atomic.AtomicLong;
import org.eclipse.microprofile.metrics.Counter;
import org.eclipse.microprofile.metrics.annotation.Metric;

/**
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Singleton
public class RequestIdentifierGenerator {

    /**
     * Source of truth for both the request identifier and the {@code wegas.requests}
     * OpenTelemetry instrument.
     */
    private final AtomicLong requests = new AtomicLong();

    /**
     * MicroProfile mirror of {@link #requests}, kept only so that {@code requests_total} stays
     * on {@code /metrics} while OpenTelemetry runs alongside it.
     *
     * @deprecated to be removed with the rest of MicroProfile Metrics, see
     *             wegas-runtime/OTEL-METRICS-MIGRATION.md
     */
    @Deprecated
    @Inject
    @Metric(name = "requests_total", description = "Total requests", absolute = true)
    private Counter mpRequests;

    /**
     * Next request identifier, unique within this instance (it restarts from 1 on each boot and
     * each cluster member has its own sequence).
     *
     * @return the identifier, as a decimal string
     */
    public String getUniqueIdentifier() {
        // incrementAndGet, not inc() + getCount(): two concurrent requests must not be handed
        // the same identifier, or their log lines get mis-paired.
        long identifier = requests.incrementAndGet();
        mpRequests.inc();
        return Long.toString(identifier, 10);
    }

    /**
     * Requests handled since startup.
     *
     * @return the current count
     */
    public long getCount() {
        return requests.get();
    }
}
