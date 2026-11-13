# Plan — Move the Wegas-specific metrics from `/metrics` to OTel / SigNoz

**Status:** steps 1–6 implemented and **verified end to end against a running Payara + local
SigNoz** (see step 5). Step 7 (removing MicroProfile Metrics) deliberately not done — it is
gated on Q1. `/metrics` is untouched and still serves all five application metrics, so the two
systems run side by side.
**Scope:** the five *application-scope* metrics Wegas registers itself. The JVM/base and
Payara/vendor metrics that also live on `/metrics` are covered in
[OTEL-METRICS-GAPS.md](OTEL-METRICS-GAPS.md).

---

## 1. What exists today

Wegas registers exactly five MicroProfile Metrics (`microprofile-metrics-api`, `provided`
scope, implemented by Payara's `microprofile-metrics` module) and Payara renders them on
`/metrics` in OpenMetrics format under the `application` scope.

All five confirmed present on production (`https://wegas.albasim.ch/metrics`, 2026-09-09),
tagged `mp_scope="application"`; live values in the last column.

| MP metric | Type | Declared in | Value source | Live |
|---|---|---|---|---|
| `online_users` | gauge | [MetricsFacade.java:33](../wegas-core/src/main/java/com/wegas/core/ejb/MetricsFacade.java#L33) | `WebsocketFacade.getOnlineUserCount()` — size of the local `onlineUsers` JCache | `1` |
| `internalcluster_size` | gauge | [MetricsFacade.java:38](../wegas-core/src/main/java/com/wegas/core/ejb/MetricsFacade.java#L38) | `ApplicationLifecycle.countMembers()` — Wegas' own member list | `4` |
| `cluster_size` | gauge | [MetricsFacade.java:43](../wegas-core/src/main/java/com/wegas/core/ejb/MetricsFacade.java#L43) | `ApplicationLifecycle.getHzSize()` — Hazelcast cluster members | `4` |
| `serverscript_cache_size` | gauge | [MetricsFacade.java:48](../wegas-core/src/main/java/com/wegas/core/ejb/MetricsFacade.java#L48) | `ScriptFacade.getCacheSize()` — static LRU cache (250 entries max) | `26` |
| `requests_total` | counter | [RequestIdentifierGenerator.java:24](../wegas-core/src/main/java/com/wegas/core/rest/util/RequestIdentifierGenerator.java#L24) | incremented once per JAX-RS request by `ViewRequestFilter` | `222` |

The application scope is emitted **once** per response, unlike base/vendor which come out
twice — see [OTEL-METRICS-GAPS.md](OTEL-METRICS-GAPS.md). The endpoint is also **public and
unauthenticated**, which is a further argument for retiring it (step 7).

Two things worth noting before touching anything:

- **`requests_total` is not just a metric.** `RequestIdentifierGenerator.getUniqueIdentifier()`
  returns `counter.getCount()` as the request id stored in `RequestManager` (used in logs).
  The counter must keep working even if we stop exporting it. OTel synchronous counters are
  write-only (no `getCount()`), so the counter itself has to become an `AtomicLong`.
- **`ApplicationStartup` warms the gauges up** ([ApplicationStartup.java:57-60](../wegas-core/src/main/java/com/wegas/core/servlet/ApplicationStartup.java#L57))
  because MP `@Gauge` registration is lazy. That workaround disappears with OTel.

## 2. Target architecture

The OTel Java agent is already attached and exporting (`OTEL_ENABLED=true`, see
[OTEL.md](OTEL.md)), and `otel.metrics.exporter=otlp` is already set in
[otel.properties](otel.properties) — so the metrics pipeline to SigNoz exists and is unused
by application code.

```
Wegas code  ──uses──▶  io.opentelemetry.api (Meter, observable instruments)
                              │
                    bridged by the javaagent's
                    opentelemetry-api-1.x modules
                              ▼
                     agent-internal OTel SDK
                     (shared with auto-instrumentation)
                              │  OTLP http/protobuf
                              ▼
                          SigNoz
```

**`/metrics` keeps working throughout.** Steps 1–6 only *add* an export path; the endpoint,
all five application metrics, and the whole base/vendor set stay exactly as they are, so the
two systems can be compared side by side. Step 7 is the only step that removes anything, and
it is gated on open question Q1.

Concretely: add `io.opentelemetry:opentelemetry-api` to `wegas-core`, create one
`@Singleton @Startup` bean that registers **asynchronous (observable) instruments** whose
callbacks read the same values the `@Gauge` methods read today, and let the agent export
them alongside the HTTP/JDBC/JVM metrics it already produces. No new infrastructure, no
extra port, no scrape target.

Verified against the versions this repo pins:

- agent `2.30.0` ([pom.xml:143](../pom.xml#L143)) → OTel API/SDK 1.63, and it ships
  `opentelemetry-api-1.x` bridge modules for API 1.0 → 1.63.
- Payara Micro `6.2024.8` already ships `MICRO-INF/runtime/opentelemetry-repackaged.jar`
  containing **non-relocated** `io.opentelemetry.api.*` (an Aug-2023 build, i.e. ≈1.29) for
  MicroProfile Telemetry. So two copies of the API can be in the JVM. This is harmless as
  long as we only use API surface that is old and stable (see risk R2).

### Why not the alternatives

| Option | Verdict |
|---|---|
| **OTel Collector with a `prometheus` receiver scraping `/metrics`** | Zero code, ports everything at once — but adds a collector to deploy, keeps the MP Metrics dependency forever, and the metric names stay `online_users` / `memory_usedHeap` rather than OTel semconv, so SigNoz's built-in JVM & APM views stay empty. Keep as a fallback (see gaps doc, Recipe D). |
| **MicroProfile Telemetry (Payara's own SDK)** | MP Telemetry 1.1 in Payara 6.2024.8 is **tracing only** — no metrics API to inject. Enabling it would also put a second SDK next to the agent's. |
| **JMX Metric Insight (`otel.jmx.config`)** | Works only for values exposed as MBeans. Payara's MP Metrics *application* scope is **not** exposed via JMX (only base/vendor are read *from* MBeans), so this cannot reach the five Wegas metrics. It is the right tool for the base/vendor gaps — see the gaps doc. |
| **Micrometer + the agent's micrometer bridge** | Would work, but means adding Micrometer as a dependency to bridge into OTel. Pointless when the OTel API is right there. |

## 3. Name and instrument mapping

New names use a `wegas.` namespace, dots (OTel convention — SigNoz shows them as-is), and
UCUM units. The two cluster-size metrics collapse into **one** instrument with an attribute,
so a single chart can show the Wegas view and the Hazelcast view and make a split-brain
obvious.

| Today | New | Instrument | Unit | Attributes |
|---|---|---|---|---|
| `online_users` | `wegas.users.online` | async UpDownCounter | `{user}` | — |
| `internalcluster_size` | `wegas.cluster.members` | async UpDownCounter | `{member}` | `wegas.cluster.registry=wegas` |
| `cluster_size` | `wegas.cluster.members` | async UpDownCounter | `{member}` | `wegas.cluster.registry=hazelcast` |
| `serverscript_cache_size` | `wegas.script.cache.entries` | async UpDownCounter | `{entry}` | — |
| `requests_total` | `wegas.requests` | async Counter (monotonic) | `{request}` | — |

`UpDownCounter` rather than `Gauge` because all four values are sums that go up and down —
that is what the OTel spec recommends, and it makes cross-instance aggregation meaningful.

On `wegas.requests`: the agent's auto-instrumentation already emits
`http.server.request.duration`, whose count gives request rate per route, per status — which
is strictly more useful. `wegas.requests` is kept only because it counts a different
population (JAX-RS requests that reach `ViewRequestFilter`, not static assets), and it is
nearly free. It is a fair candidate to drop; decide once the SigNoz APM view is in use.

## 4. Implementation steps

### Step 0 — baseline (done)

Captured from production on 2026-09-09; the five application series and their values are in
§1 above, the full 28-series inventory is in [OTEL-METRICS-GAPS.md](OTEL-METRICS-GAPS.md).
Re-capture before the cut-over so the A/B in step 5 compares against fresh numbers:

```bash
curl -s https://wegas.albasim.ch/metrics > /tmp/wegas-metrics-before.txt
```

### Step 1 — dependency

One dependency in `wegas-core/pom.xml`, with **no version and no BOM**:

```xml
<dependency>
  <groupId>io.opentelemetry</groupId>
  <artifactId>opentelemetry-api</artifactId>
  <scope>provided</scope>
</dependency>
```

`payara-bom` — already imported in the root [pom.xml](../pom.xml) — manages
`io.opentelemetry:opentelemetry-api` at **1.29.0**, the version Payara Micro 6.2024.8 itself
ships, and its `opentelemetry-repackaged.jar` OSGi bundle **exports `io.opentelemetry.api.*`
(including `io.opentelemetry.api.metrics`, `version="1.29.0"`) to deployed applications**.
Verified with `mvn dependency:tree` and the bundle's `Export-Package` manifest header.

That is a better outcome than pinning our own version, and it is why `provided` is correct:

- nothing is added to `WEB-INF/lib`, so there is exactly **one** copy of the API at runtime —
  which removes risk R2 rather than mitigating it;
- the code compiles against precisely the API the platform provides, so a `NoSuchMethodError`
  at boot is impossible;
- a Payara upgrade moves the API version in lockstep, which is what you want.

Do not pin a version, do not switch to `compile`, and never add the SDK, the exporters or
`opentelemetry-sdk-extension-autoconfigure` — the agent provides all of that, and a second SDK
in the war is the classic way to end up with two pipelines and no data.

### Step 2 — the metrics bean

New file `wegas-core/src/main/java/com/wegas/core/telemetry/WegasMetrics.java` (license
header as in the neighbouring files). Sketch:

```java
@Singleton
@Startup
public class WegasMetrics {

    private static final Logger logger = LoggerFactory.getLogger(WegasMetrics.class);
    private static final String SCOPE = "com.wegas.core";
    private static final Attributes WEGAS_REGISTRY =
            Attributes.of(AttributeKey.stringKey("wegas.cluster.registry"), "wegas");
    private static final Attributes HZ_REGISTRY =
            Attributes.of(AttributeKey.stringKey("wegas.cluster.registry"), "hazelcast");

    @Inject private ApplicationLifecycle applicationLifecycle;
    @Inject private WebsocketFacade websocketFacade;
    @Inject private ScriptFacade scriptFacade;
    @Inject private RequestIdentifierGenerator requestIdentifierGenerator;

    private final List<AutoCloseable> instruments = new ArrayList<>();

    @PostConstruct
    public void registerInstruments() {
        Meter meter = GlobalOpenTelemetry.getMeter(SCOPE);

        instruments.add(meter.upDownCounterBuilder("wegas.users.online")
                .setDescription("Users currently online on this instance")
                .setUnit("{user}")
                .buildWithCallback(m -> observe(m, websocketFacade::getOnlineUserCount)));

        instruments.add(meter.upDownCounterBuilder("wegas.cluster.members")
                .setDescription("Members of the Wegas cluster, per membership registry")
                .setUnit("{member}")
                .buildWithCallback(m -> {
                    observe(m, applicationLifecycle::countMembers, WEGAS_REGISTRY);
                    observe(m, applicationLifecycle::getHzSize, HZ_REGISTRY);
                }));

        instruments.add(meter.upDownCounterBuilder("wegas.script.cache.entries")
                .setDescription("Entries in the server-script cache")
                .setUnit("{entry}")
                .buildWithCallback(m -> observe(m, scriptFacade::getCacheSize)));

        instruments.add(meter.counterBuilder("wegas.requests")
                .setDescription("JAX-RS requests handled since startup")
                .setUnit("{request}")
                .buildWithCallback(m -> observe(m, requestIdentifierGenerator::getCount)));
    }

    @PreDestroy
    public void close() { /* close each instrument, log failures */ }

    /** Never let a metric callback throw: one bad callback kills the whole export cycle. */
    private static void observe(ObservableLongMeasurement m, LongSupplier v, Attributes... a) {
        try {
            m.record(v.getAsLong(), a.length > 0 ? a[0] : Attributes.empty());
        } catch (RuntimeException e) {
            logger.warn("metric callback failed", e);
        }
    }
}
```

The `try/catch` is not optional. Callbacks run on the SDK's collection thread; an exception
there is swallowed by the SDK at best and can drop the whole collection at worst — and one of
these callbacks iterates a Hazelcast cache.

### Step 3 — make the request counter readable

In [RequestIdentifierGenerator.java](../wegas-core/src/main/java/com/wegas/core/rest/util/RequestIdentifierGenerator.java),
add an `AtomicLong` as the source of truth and expose it. Keep the injected MP `Counter`
ticking for now, so `requests_total` stays on `/metrics` for the whole dual-running period
(the two `@Metric` lines are deleted in step 7, together with `MetricsFacade`):

```java
private final AtomicLong requests = new AtomicLong();

@Inject
@Metric(name = "requests_total", description = "Total requests", absolute = true)
private Counter mpRequests; // TODO remove with the rest of MP Metrics (step 7)

public String getUniqueIdentifier() {
    long id = requests.incrementAndGet();
    mpRequests.inc();
    return Long.toString(id, 10);
}

public long getCount() {
    return requests.get();
}
```

The `AtomicLong`, not the MP counter, now produces the id — and that is not a pure refactor,
it fixes a
latent bug. `requests.inc()` followed by `requests.getCount()` is **two** operations: with 9
HTTP threads ([run](run) sets `NB_THREADS=9`), two concurrent requests can both increment and
then both read the same post-increment value, so they get the **same request id** while
another id is never used. Since the id's only job is to pair the `Start Request [n]` line with
the `Request [n] … processed in … ms` line
([ViewRequestFilter.java:104](../wegas-core/src/main/java/com/wegas/core/rest/util/ViewRequestFilter.java#L104),
[RequestManager.java:1341](../wegas-core/src/main/java/com/wegas/core/ejb/RequestManager.java#L1341)),
a collision silently mis-pairs two requests in the log. `incrementAndGet()` is atomic and
cannot do that.

Note the id is also only unique *per instance* — production runs 4 members, so id `222` exists
four times over. That is a pre-existing limitation, not something this change alters; see Q3.

### Step 4 — configuration

[otel.properties](otel.properties) needs nothing for the Wegas metrics — `otel.metrics.exporter=otlp`
already covers them. Two additions are worth making anyway:

```properties
# Explicit, so the gauge sampling period is obvious (this is also the SDK default).
otel.metric.export.interval=60000
```

And, per instance, a stable identity — otherwise per-node gauges like `wegas.users.online`
cannot be told apart in a cluster. The agent bundles only an *incubating*
`service.instance.id` provider that generates a fresh random id per JVM run, so set it
explicitly rather than relying on that. In [run](run) and in the
[Dockerfile](src/main/docker/wegas/Dockerfile):

```bash
OTEL_RESOURCE_ATTRIBUTES="service.instance.id=$(hostname),deployment.environment.name=${WEGAS_ENV:-dev}"
```

### Step 5 — verify

**Done, on a real deployment.** Local Payara (`./run`, agent attached via `otel.properties`)
against a local SigNoz, 2026-09-09. Values read straight out of SigNoz's ClickHouse, so no UI
login was involved:

| Metric | In SigNoz | Cross-check vs `/metrics` |
|---|---|---|
| `wegas.users.online` | ✅ | `0` = `online_users 0` |
| `wegas.cluster.members` | ✅ two series, `wegas.cluster.registry` = `wegas` / `hazelcast`, both `1` | = `internalcluster_size 1`, `cluster_size 1` |
| `wegas.script.cache.entries` | ✅ | `0` = `serverscript_cache_size 0` |
| `wegas.requests` | ✅ `0 → 8 → 20` across export cycles | tracked `requests_total` exactly at every step |

Also confirmed on that run:

- `service.instance.id = Daniels-MacBook-Pro-2.local` — the step 4 change works; without it the
  agent's incubating provider had been emitting a fresh random UUID per boot (visible on the
  older container runs in the same SigNoz).
- Metric names keep their dots in SigNoz (`wegas.users.online`, not `wegas_users_online`).
- All five MicroProfile metrics were still on `/metrics` throughout, `requests_total` included —
  the dual-run in step 3 does what it claims.
- 39 distinct metrics from this instance: the four `wegas.*` plus the agent's JVM and
  `http.server`/`http.client` sets.

Useful detail for generating traffic: only `/<context>/rest/Extended/…` actually reaches
`ViewRequestFilter` and increments the counter. Shiro answers `Lobby`, `Editor` and `Public`
with a `302` before JAX-RS runs, so those never touch the filter. With `--deploy <dir>` the
context root is the directory name (`/Wegas/…`), not `/`.

To repeat it:

1. Start SigNoz per [HOWTO-SigNoz.md](HOWTO-SigNoz.md) — including the login step, telemetry
   is dropped until onboarding is finished.
2. `OTEL_ENABLED=true ./run`, and check the boot log for
   `WegasMetrics - Registered 4 OpenTelemetry instruments`. If that line is missing, the bean
   never started and nothing else will work.
3. Open a scenario in the Wegas UI so the values are non-zero, then in SigNoz go to
   **Metrics** and search `wegas.` — the four instruments should appear within one or two
   export intervals (60 s each).
4. Cross-check against the old endpoint while both exist:
   `curl -s localhost:<port>/metrics | grep -E 'online_users|cluster|serverscript|requests'`.
   Numbers should match, allowing for the sampling offset.
5. Watch for `Metric callback failed` in `server.log` — that is R1 materialising, and the fix
   is the `@Schedule` snapshot described there.
6. If nothing arrives at all, bypass the network:
   `OTEL_ENABLED=true OTEL_METRICS_EXPORTER=otlp,logging ./run` and grep `server.log` for
   `wegas.`.

### Step 6 — dashboard and alerts in SigNoz

Panel-by-panel and alert-by-alert specification, including which aggregation and group-by each
panel needs: [signoz/README.md](signoz/README.md).

It is a spec rather than an importable `.json` on purpose — a dashboard export encodes the
query-builder schema and metric-name normalisation of the SigNoz version that produced it, so
one written blind imports as something subtly wrong. Build the panels once in the UI, then
export the JSON to `wegas-runtime/signoz/wegas-runtime.json` so it is versioned from then on.

### Step 7 — retire MicroProfile Metrics

**Only after** the gaps doc's base/vendor items are resolved and after confirming nothing
scrapes `/metrics` (see open question Q1). Then:

- delete [MetricsFacade.java](../wegas-core/src/main/java/com/wegas/core/ejb/MetricsFacade.java);
- drop the warm-up block and the `MetricsFacade` injection from
  [ApplicationStartup.java:50-60](../wegas-core/src/main/java/com/wegas/core/servlet/ApplicationStartup.java#L50);
- remove the `microprofile-metrics-api` dependency from
  [wegas-core/pom.xml:277](../wegas-core/pom.xml#L277) (it is `provided`, so nothing else
  changes);
- optionally disable the endpoint itself in [as_prebootcmd](as_prebootcmd):
  `set configs.config.server-config.microprofile-metrics-configuration.enabled=false`
  — **verify that config path against `asadmin get 'configs.config.server-config.microprofile-metrics-configuration.*'` before committing it**; it has not been checked here.

Suggested sequencing: steps 1–6 in one PR (both systems live, easy A/B), step 7 in a second
PR after a week of dual running.

## 5. Risks and open questions

**R1 — Observable callbacks call `@Stateless` EJBs from a non-container thread. Resolved on a
real deployment.** `WebsocketFacade` and `ScriptFacade` are `@Stateless @LocalBean` and the OTel
collection thread is not container-managed, so this was the most likely thing to break. It
does not: over 5 consecutive export cycles every instrument produced a data point in every
cycle — `wegas.cluster.members` 10 points (5 × 2 registries), the other three 5 each, no gaps —
which means no callback ever threw. Invoking these beans through their local EJB proxy from the
SDK thread works on Payara 6.2024.8.

Keep the `try/catch` regardless: it costs nothing and a swallowed exception is the difference
between one missing series and a broken collection cycle. If a future change does make a
callback fail, `Metric callback failed` appears in `server.log` and the fallback is an
`@Singleton @Startup` bean with `@Schedule(minute = "*", persistent = false)` (the pattern in
[EjbTimerFacade.java](../wegas-core/src/main/java/com/wegas/core/ejb/cron/EjbTimerFacade.java))
writing into `AtomicInteger`s that the callbacks then just read.

**R2 — Two copies of `io.opentelemetry.api`. Resolved, not merely mitigated.** By taking the
`provided` 1.29.0 that `payara-bom` manages (step 1), nothing is bundled and there is a single
copy at runtime. The bridge was then verified directly: a standalone program compiled against
`opentelemetry-api:1.29.0` and run under the pinned agent registered the same three instrument
shapes used here and the agent exported all of them —

```
MeterClass=io.opentelemetry.javaagent.instrumentation.opentelemetryapi.v1_32.metrics.ApplicationMeter132
telemetry.distro.version="2.30.0", telemetry.sdk.version="1.64.0"
name=wegas.users.online,     unit={user},    type=LONG_SUM, monotonic=false
name=wegas.cluster.members,  unit={member},  type=LONG_SUM, monotonic=false,
    points=[{wegas.cluster.registry="wegas"}, {wegas.cluster.registry="hazelcast"}]
name=wegas.requests,         unit={request}, type=LONG_SUM, monotonic=true
```

so API 1.29 → agent-2.30 SDK bridging, observable instruments, units and multi-point
attributes are all confirmed working. Keep to that API surface anyway (`Meter`, `*Builder`,
`buildWithCallback`, `Attributes`, `AttributeKey`, `ObservableLongMeasurement`) — it is what
1.29 offers.

**R3 — Cost of the `online_users` callback.** `getOnlineUserCount()` iterates the
`onlineUsers` JCache. That already happened on every `/metrics` scrape, and it now happens
once per export interval (60 s), so this is a wash — but if the export interval is ever
lowered, this is the callback that will hurt.

**R4 — Gauges become per-`service.instance.id` series.** Without step 4's resource attribute,
several nodes collapse into one ambiguous series in SigNoz.

**Q1 — Is `/metrics` scraped by anything today?** Still open, and it is the only real blocker
on step 7. What is known: the endpoint is live, public and unauthenticated on
`https://wegas.albasim.ch/metrics`, and nothing in this repo configures a scrape (no scrape
config, no pod annotations, no Grafana dashboards) — but the deployment lives elsewhere. Check
for a Prometheus job / Grafana dashboard on the ops side before removing anything; if one
exists, Recipe D in the gaps doc is the bridge.

**Q2 — Should `wegas.requests` survive at all?** See §3.

**Q3 — Trace ids vs `RequestManager.requestId`.** With the agent attached, every request
already has a trace id that SigNoz can search. Putting the trace id into the log MDC (or the
request id onto the span as an attribute) would make log↔trace correlation work and could
eventually replace the hand-rolled request id entirely. Out of scope here, worth its own
ticket.
