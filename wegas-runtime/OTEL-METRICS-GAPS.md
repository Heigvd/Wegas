# `/metrics` → SigNoz coverage gaps

What is still exposed on Payara's `/metrics` endpoint that has **no equivalent in SigNoz**
once the OTel agent is attached, and how to port each item.

The five Wegas-specific *application-scope* metrics are handled separately in
[OTEL-METRICS-MIGRATION.md](OTEL-METRICS-MIGRATION.md); this document covers the **base**
(JVM) and **vendor** (Payara) scopes, which Wegas does not declare but Payara publishes for
free.

---

## How this list was established

Live dump from production, `https://wegas.albasim.ch/metrics`, taken 2026-09-09 — **28
distinct series, 51 lines**. Cross-checked against `metrics.xml` inside
`MICRO-INF/runtime/microprofile-metrics.jar` (Payara Micro 6.2024.8, MP Metrics 5.1), which
defines what the endpoint *can* publish. The OTel side is the agent pinned in
[pom.xml:143](../pom.xml#L143) (`2.30.0`), specifically its `runtime-telemetry`
instrumentation (JVM metrics) and `jmx-metrics` module (JMX Metric Insight).

Reproduce with:

```bash
curl -s https://wegas.albasim.ch/metrics > /tmp/wegas-metrics-before.txt
grep -E '^[a-z]' /tmp/wegas-metrics-before.txt | sed 's/ [0-9.].*$//' | sort -u
```

Three things the live dump settled:

- **The endpoint is public and unauthenticated.** Payara's `secure-metrics` /
  `security-enabled` is off and the reverse proxy does not shield it, so JVM internals, thread
  counts, uptime and cluster size are readable by anyone. Retiring the endpoint closes this;
  until then it is an argument for doing so sooner.
- **Base and vendor series are emitted twice** in a single response (38 base lines for 19
  series, 8 vendor lines for 4). MP Metrics writes those registries once per context. Any
  Prometheus scrape of this endpoint has been ingesting duplicates.
- **No `REST.request` metrics.** Payara does not implement MP Metrics' optional JAX-RS
  timers, so there is nothing per-endpoint to lose — and the agent's
  `http.server.request.duration` is a strict upgrade.

Legend: **✅ covered** by the agent out of the box · **⚠️ partial / needs a flag** ·
**❌ missing**, needs a recipe from §4.

---

## 1. Base scope — JVM metrics (19 series, all present in the dump)

Mostly free: the agent's `runtime-telemetry` instrumentation emits the
[JVM semantic conventions](https://github.com/open-telemetry/semantic-conventions/blob/main/docs/runtime/jvm-metrics.md)
by default, and SigNoz's JVM views are keyed on exactly those names.

| Exposed on `/metrics` | OTel equivalent | Status |
|---|---|---|
| `memory_usedHeap_bytes` | `jvm.memory.used{jvm.memory.type=heap}` | ✅ |
| `memory_committedHeap_bytes` | `jvm.memory.committed{jvm.memory.type=heap}` | ✅ |
| `memory_maxHeap_bytes` | `jvm.memory.limit{jvm.memory.type=heap}` | ✅ |
| `memory_usedNonHeap_bytes` | `jvm.memory.used{jvm.memory.type=non_heap}` | ✅ |
| `memory_committedNonHeap_bytes` | `jvm.memory.committed{jvm.memory.type=non_heap}` | ✅ |
| `memory_maxNonHeap_bytes` | `jvm.memory.limit{jvm.memory.type=non_heap}` | ⚠️ `jvm.memory.limit` is only reported for pools that declare one, so non-heap pools may be missing. Sum over pools rather than expecting a single value. |
| `thread_count` | `jvm.thread.count` | ✅ |
| `thread_daemon_count` | `jvm.thread.count{jvm.thread.daemon=true}` | ✅ same instrument, filtered by attribute. Verified against SigNoz: `jvm.thread.count` arrives with both `jvm.thread.daemon` (`true`/`false`) and `jvm.thread.state` (`runnable`, `waiting`, `timed_waiting`, …), so the daemon split is a real query and you also get a state breakdown the endpoint never had. |
| `thread_max_count` (peak since start) | — | ❌ **Recipe B** |
| `classloader_loadedClasses_count` | `jvm.class.count` | ✅ |
| `classloader_loadedClasses_total` | `jvm.class.loaded` | ✅ |
| `classloader_unloadedClasses_total` | `jvm.class.unloaded` | ✅ |
| `cpu_availableProcessors` | `jvm.cpu.count` | ✅ Verified present in SigNoz from the plain agent, no flags. (The upstream `runtime-telemetry` README omits `jvm.cpu.count` from its stable table and lists it only under the JFR path — the README is misleading here; trust the live dump.) |
| `cpu_systemLoadAverage` | — | ❌ **Recipe B** |
| `jvm_uptime_seconds` | — | ❌ **Recipe B** |
| `gc_total{name="G1 Young Generation"}`, `{name="G1 Old Generation"}` | count of `jvm.gc.duration{jvm.gc.name}` | ⚠️ the histogram's count *is* the collection count, so the data is there, but the query changes and the attributes become `jvm.gc.name` / `jvm.gc.action`. |
| `gc_time_seconds_total{name=…}` | sum of `jvm.gc.duration{jvm.gc.name}` | ⚠️ as above. Units already match — both are seconds — so thresholds carry over unchanged. |

**Bonus, not on `/metrics` at all:** `jvm.cpu.time`, `jvm.cpu.recent_utilization`,
`jvm.memory.used_after_last_gc` (the one that actually shows a heap that never drains), plus
everything the auto-instrumentation adds — `http.server.request.duration`,
`db.client.operation.duration`, and distributed traces. The migration is a net gain before a
single gap below is closed.

## 2. Vendor scope — Payara metrics (4 series)

| Exposed on `/metrics` | Live value | OTel equivalent | Status |
|---|---|---|---|
| `system_cpu_load` | 0.011 – 0.154 | `jvm.system.cpu.utilization` | ⚠️ **Recipe A** — exists, but it is an *experimental* metric, off by default. |
| `connection_pool_H2Pool_totalConnection` | `0.0` | — | ❌ see §3 — **recommend dropping** |
| `connection_pool_H2Pool_usedConnection_total` | `0.0` | — | ❌ ditto |
| `connection_pool_H2Pool_freeConnection_total` | `0.0` | — | ❌ ditto |

`thread_stuck_count` / `thread_stuck_maxDuration` are declared in `metrics.xml` but **absent
from the live dump** — Payara's stuck-thread health check is not enabled. Nothing to port.

## 3. The connection-pool metrics are worth less than they look

The only pool reported is **`H2Pool`** — Payara's stock H2 sample datasource — and all three
of its series are flat `0.0` because nothing uses it. The pool Wegas actually runs on is
**not covered at all**: it is declared in the application as
`@DataSourceDefinition(name = "java:global/WegasDS", …)`
([DataSourceDefinitionProvider.java:19](../wegas-core/src/main/java/com/wegas/core/setup/DataSourceDefinitionProvider.java#L19)),
so it is an app-scoped datasource, not a server-level JDBC connection pool, and Payara's
`healthcheck-cpool` service never sees it.

So this is not a porting job — there is no signal to preserve. Pool saturation is a real
Wegas failure mode and worth instrumenting, but it is **new work**, and none of it is
blocking the retirement of `/metrics`:

- OTel's `db.client.connection.*` semconv metrics come only from the agent's HikariCP / c3p0 /
  Vibur instrumentation. Payara's own pool implementation fires none of them.
- The agent's JDBC instrumentation already gives `db.client.operation.duration`, which answers
  "are queries slow / are they piling up" — usually enough in practice.
- If real pool gauges are wanted: raise the monitoring level
  (`set configs.config.server-config.monitoring-service.module-monitoring-levels.jdbc-connection-pool=HIGH`),
  find the MBean for `WegasDS` with `jconsole`, then write a Recipe B rule against it. Its
  attributes are GlassFish `Statistic` composites (`RangeStatistic`, `CountStatistic`), not
  plain numbers — readable via JMX Insight's dotted composite syntax, but **the exact names
  must be read off a live server, not written from memory**. Track it as its own ticket.

## 4. Porting recipes

### Recipe A — flip on the experimental JVM metrics

Covers `system_cpu_load`, and adds buffer-pool metrics and `jvm.memory.init` for free. In
[otel.properties](otel.properties):

```properties
otel.instrumentation.runtime-telemetry.emit-experimental-metrics=true
```

"Experimental" means *not yet stable in the semantic conventions* — the names may change on a
future agent upgrade. Fine for `jvm.system.cpu.utilization`; just note it on any alert built
on it.

### Recipe B — a custom JMX Metric Insight rule file

For anything readable from an MBean, which is every remaining ❌ in §1. The agent's
`jmx-metrics` module reads YAML rule files listed in `otel.jmx.config` (comma-separated,
absolute or relative) and emits the result through the same SDK, exporter and interval as
everything else, under the `io.opentelemetry.jmx` scope. Related knobs:
`otel.jmx.target.system` (only for the *bundled* profiles — `jvm`, `tomcat`, `wildfly`,
`jetty`, …; there is no Payara or GlassFish profile) and `otel.jmx.discovery.delay`.

Create `wegas-runtime/otel-jmx-metrics.yaml`:

```yaml
---
# Fills the gaps left by the agent's runtime-telemetry instrumentation, so that the
# Wegas /metrics endpoint can be retired. See OTEL-METRICS-GAPS.md.
rules:
  - bean: java.lang:type=Threading
    mapping:
      PeakThreadCount:
        metric: wegas.jvm.thread.peak_count
        type: gauge
        unit: "{thread}"
        desc: Peak live thread count since JVM start (or since the peak was reset)

  # AvailableProcessors is NOT needed here: the agent already emits jvm.cpu.count.
  - bean: java.lang:type=OperatingSystem
    mapping:
      SystemLoadAverage:
        metric: system.cpu.load_average.1m
        type: gauge
        unit: "1"
        desc: System load average over the last minute (negative when unavailable)

  - bean: java.lang:type=Runtime
    mapping:
      Uptime:
        metric: process.uptime
        type: gauge
        sourceUnit: ms
        unit: s
        desc: JVM uptime
```

Notes on the choices:

- `jvm.cpu.count`, `system.cpu.load_average.1m` and `process.uptime` are the real semantic
  convention names for these exact values, so they are used verbatim and SigNoz's stock panels
  can pick them up. `PeakThreadCount` has no semconv name, so it takes a `wegas.` prefix
  rather than an invented `jvm.*` one that a future agent version might collide with.
- `sourceUnit: ms` / `unit: s` makes the agent convert; OTel durations are always seconds.
  (Note the endpoint already published `jvm_uptime_seconds`, so no threshold changes either.)
- `SystemLoadAverage` returns `-1` where unavailable. Filter that in dashboard queries rather
  than charting it raw.

Wire it up in [run](run), next to the existing `OTEL_CONFIG_FILE` handling:

```bash
OTEL_JMX_CONFIG="${OTEL_JMX_CONFIG:-otel-jmx-metrics.yaml}"
[ -f "${OTEL_JMX_CONFIG}" ] && OTEL_OPTS="${OTEL_OPTS} -Dotel.jmx.config=${OTEL_JMX_CONFIG}"
```

and in the [Dockerfile](src/main/docker/wegas/Dockerfile), `COPY` the file next to the agent
jar plus `ENV OTEL_JMX_CONFIG=${WORKDIR}/otel-jmx-metrics.yaml`.

Verify with `OTEL_METRICS_EXPORTER=otlp,logging` and grep the server log for the new names — a
typo in an ObjectName or attribute produces silence, not an error.

### Recipe C — instrument it in application code

For values with no MBean behind them. Nothing in the live dump needs this: the stuck-thread
metrics are not even enabled, and the connection-pool story is §3. Kept here only as the
pattern to follow if a future need appears — same mechanism as
[OTEL-METRICS-MIGRATION.md §4 step 2](OTEL-METRICS-MIGRATION.md).

### Recipe D — fallback: scrape `/metrics` through a collector

If something outside this repo turns out to depend on the exact `/metrics` names (see
[Q1](OTEL-METRICS-MIGRATION.md#5-risks-and-open-questions)), an OTel Collector with a
`prometheus` receiver on Payara's endpoint and an `otlp` exporter to SigNoz ports everything
in one step, unchanged:

```yaml
receivers:
  prometheus:
    config:
      scrape_configs:
        - job_name: wegas
          scrape_interval: 30s
          static_configs:
            - targets: ['wegas:8080']
exporters:
  otlp:
    endpoint: signoz-otel-collector:4317
    tls: { insecure: true }
service:
  pipelines:
    metrics:
      receivers: [prometheus]
      exporters: [otlp]
```

Trade-off: a collector to deploy and keep alive, the MP Metrics dependency stays forever, the
duplicate base/vendor series come along for the ride, and the names stay MicroProfile-shaped
(`memory_usedHeap_bytes`, `online_users`) — so SigNoz's built-in JVM and APM views stay empty
and every dashboard is hand-built. A transition bridge, not a destination.

## 5. Suggested order of work

Verified against a live SigNoz on 2026-09-09: with the plain agent the instance reports 39
metrics — 12 of the 19 base series covered, plus `jvm.cpu.count` and the `jvm.thread.daemon` /
`jvm.thread.state` breakdowns. That leaves exactly **three** real gaps for Recipe B.

1. Recipe A — one line, closes `system_cpu_load`.
2. Recipe B — one small file, closes `thread_max_count`, `cpu_systemLoadAverage`,
   `jvm_uptime_seconds`.
3. Re-point any alert built on `gc_total` / `gc_time_seconds_total` at `jvm.gc.duration`
   (⚠️ rows in §1). Units already match; only the query shape and attribute names change.
4. Record the decision to **drop** `thread_stuck_*` (not enabled) and the `H2Pool` series (§3),
   and open a separate ticket if `WegasDS` pool visibility is actually wanted.
5. Retire `/metrics`
   ([migration plan step 7](OTEL-METRICS-MIGRATION.md#step-7--retire-microprofile-metrics)) —
   which also closes the unauthenticated public exposure noted above.
