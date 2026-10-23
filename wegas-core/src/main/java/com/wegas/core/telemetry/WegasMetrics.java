/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2026 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.telemetry;

import com.wegas.core.ejb.ApplicationLifecycle;
import com.wegas.core.ejb.ScriptFacade;
import com.wegas.core.ejb.WebsocketFacade;
import com.wegas.core.rest.util.RequestIdentifierGenerator;
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.common.AttributeKey;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.metrics.Meter;
import io.opentelemetry.api.metrics.ObservableLongMeasurement;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.ejb.Singleton;
import jakarta.ejb.Startup;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.function.LongSupplier;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Registers the Wegas-specific OpenTelemetry metrics.
 * <p>
 * The instruments are asynchronous: their callbacks are invoked by the SDK once per export
 * interval ({@code otel.metric.export.interval}, 60s by default) and read the same values the
 * MicroProfile {@code @Gauge} methods expose on {@code /metrics}.
 * <p>
 * The OpenTelemetry SDK is provided by the java agent (see wegas-runtime/OTEL.md). When the
 * agent is not attached, {@link GlobalOpenTelemetry} hands out no-op instruments and the
 * callbacks below are never invoked.
 *
 * @see com.wegas.core.ejb.MetricsFacade the MicroProfile counterpart, exposed on /metrics
 *
 * @author Daniel Gonzalez Lopez (daniel.gonzalezlopez@heig-vd.ch)
 */
@Singleton
@Startup
public class WegasMetrics {

    private static final Logger logger = LoggerFactory.getLogger(WegasMetrics.class);

    /**
     * Instrumentation scope name, as reported to the backend.
     */
    private static final String SCOPE = "com.wegas.core";

    /**
     * Which membership registry a {@code wegas.cluster.members} data point comes from. Both are
     * reported so that a divergence between Wegas' own member list and Hazelcast's view of the
     * cluster shows up on a single chart.
     */
    private static final AttributeKey<String> CLUSTER_REGISTRY
        = AttributeKey.stringKey("wegas.cluster.registry");

    private static final Attributes WEGAS_REGISTRY = Attributes.of(CLUSTER_REGISTRY, "wegas");
    private static final Attributes HZ_REGISTRY = Attributes.of(CLUSTER_REGISTRY, "hazelcast");

    @Inject
    private ApplicationLifecycle applicationLifecycle;

    @Inject
    private WebsocketFacade websocketFacade;

    @Inject
    private ScriptFacade scriptFacade;

    @Inject
    private RequestIdentifierGenerator requestIdentifierGenerator;

    /**
     * Registered instruments, closed on undeploy so that a redeploy does not stack callbacks.
     */
    private final List<AutoCloseable> instruments = new ArrayList<>();

    @PostConstruct
    public void registerInstruments() {
        Meter meter = GlobalOpenTelemetry.getMeter(SCOPE);

        instruments.add(meter.upDownCounterBuilder("wegas.users.online")
            .setDescription("Users currently online on this instance")
            .setUnit("{user}")
            .buildWithCallback(measurement
                -> observe(measurement, websocketFacade::getOnlineUserCount)));

        instruments.add(meter.upDownCounterBuilder("wegas.cluster.members")
            .setDescription("Members of the Wegas cluster, per membership registry")
            .setUnit("{member}")
            .buildWithCallback(measurement -> {
                observe(measurement, applicationLifecycle::countMembers, WEGAS_REGISTRY);
                observe(measurement, applicationLifecycle::getHzSize, HZ_REGISTRY);
            }));

        instruments.add(meter.upDownCounterBuilder("wegas.script.cache.entries")
            .setDescription("Entries in the server-script cache")
            .setUnit("{entry}")
            .buildWithCallback(measurement
                -> observe(measurement, scriptFacade::getCacheSize)));

        instruments.add(meter.counterBuilder("wegas.requests")
            .setDescription("JAX-RS requests handled since startup")
            .setUnit("{request}")
            .buildWithCallback(measurement
                -> observe(measurement, requestIdentifierGenerator::getCount)));

        logger.info("Registered {} OpenTelemetry instruments", instruments.size());
    }

    @PreDestroy
    public void unregisterInstruments() {
        for (AutoCloseable instrument : instruments) {
            try {
                instrument.close();
            } catch (Exception ex) { // NOPMD AutoCloseable#close declares Exception
                logger.warn("Failed to close instrument", ex);
            }
        }
        instruments.clear();
    }

    private static void observe(ObservableLongMeasurement measurement, LongSupplier supplier) {
        observe(measurement, supplier, Attributes.empty());
    }

    /**
     * Record one data point, swallowing failures.
     * <p>
     * Callbacks run on the SDK collection thread, outside of any request: an exception thrown
     * here would be lost at best and could compromise the whole collection cycle at worst.
     */
    private static void observe(ObservableLongMeasurement measurement, LongSupplier supplier,
        Attributes attributes) {
        try {
            measurement.record(supplier.getAsLong(), attributes);
        } catch (RuntimeException ex) {
            logger.warn("Metric callback failed", ex);
        }
    }
}
