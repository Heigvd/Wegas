# OpenTelemetry Java Agent — Configuration Guide

This document explains how the OpenTelemetry (OTel) Java agent is configured for Wegas:
the variables involved, how the two configuration formats (`otel.*` vs `OTEL_*`) relate,
the precedence rules, and — importantly — why **`OTEL_ENABLED` must live in the
environment / command line** for the agent to be attached at all.

The agent is attached in the launch script [`wegas-runtime/run`](run) via the JVM
`-javaagent:` flag, and it auto-instruments HTTP, JAX-RS, JDBC/Postgres, etc. and exports
telemetry over OTLP to a collector/backend of your choice (e.g. a self-hosted SigNoz).

---

## 1. Two kinds of variables — don't confuse them

There are **two distinct categories** of variables at play.

### a) Script-level variables (read by `run`, *not* by the agent)

These are plain shell variables that the `run` script reads to decide **how to launch the
JVM**. The OTel agent never sees them.

| Variable         | Default                             | Purpose                                                                 |
|------------------|-------------------------------------|-------------------------------------------------------------------------|
| `OTEL_ENABLED`   | `false`                             | Main on/off switch. When `true`, `run` adds `-javaagent:` to the JVM. |
| `OTEL_AGENT_JAR` | `target/opentelemetry-javaagent.jar`| Path to the agent jar (Docker image sets `/opt/wegas/...`).             |
| `OTEL_CONFIG_FILE` | `otel.properties`                 | Optional agent config file passed via `-Dotel.javaagent.configuration-file`. |

> ⚠️ **These cannot be set through `default_wegas.properties` / `wegas-override.properties`.**
> Those Wegas files are handed to Payara via `--systemproperties` and are only applied
> *after* the JVM has started and Payara boots — far too late, and with the wrong key form.
> Script-level variables must be real environment variables or passed on the command line.

### b) OpenTelemetry agent variables (read by the agent itself)

These configure the agent's behaviour (where to export, what to export, service name, …).
They come in two interchangeable **formats** (see §2) and can be supplied via environment
variables, `-D` system properties, or the agent config file (see §4).

| Dotted form (`otel.*`)          | Env-var form (`OTEL_*`)          | Meaning                                                                 |
|---------------------------------|----------------------------------|-------------------------------------------------------------------------|
| `otel.service.name`             | `OTEL_SERVICE_NAME`              | Logical service name shown in the backend (e.g. `wegas`).               |
| `otel.exporter.otlp.endpoint`   | `OTEL_EXPORTER_OTLP_ENDPOINT`    | OTLP collector URL (e.g. `http://localhost:4318`).                      |
| `otel.exporter.otlp.protocol`   | `OTEL_EXPORTER_OTLP_PROTOCOL`    | `http/protobuf` (port 4318) or `grpc` (port 4317).                      |
| `otel.traces.exporter`          | `OTEL_TRACES_EXPORTER`           | `otlp`, `logging`, `none`, or a comma list (e.g. `otlp,logging`).       |
| `otel.metrics.exporter`         | `OTEL_METRICS_EXPORTER`          | `otlp`, `logging`, `none`.                                              |
| `otel.logs.exporter`            | `OTEL_LOGS_EXPORTER`             | `otlp`, `logging`, `none`.                                              |
| `otel.resource.attributes`      | `OTEL_RESOURCE_ATTRIBUTES`       | Extra resource tags, e.g. `deployment.environment=dev,service.version=4.1`. |
| `otel.traces.sampler`           | `OTEL_TRACES_SAMPLER`            | e.g. `parentbased_always_on` (default) or `parentbased_traceidratio`.   |
| `otel.traces.sampler.arg`       | `OTEL_TRACES_SAMPLER_ARG`        | Sampler argument, e.g. `0.1` for 10% sampling.                          |
| `otel.exporter.otlp.headers`    | `OTEL_EXPORTER_OTLP_HEADERS`     | Auth headers (e.g. ingestion key). **Secret — env/secret-manager only.** |
| `otel.javaagent.configuration-file` | `OTEL_JAVAAGENT_CONFIGURATION_FILE` | Path to an agent properties file (see §4).                       |
| `otel.sdk.disabled`             | `OTEL_SDK_DISABLED`              | Alternative kill-switch (see §5).                                       |

---

## 2. Dotted format ↔ environment-variable format

Every OTel setting has two equivalent names. To convert the **dotted** system-property
form to the **environment-variable** form:

1. Convert to **UPPERCASE**.
2. Replace every `.` **and** `-` with `_`.

```
otel.exporter.otlp.endpoint        ->  OTEL_EXPORTER_OTLP_ENDPOINT
otel.service.name                  ->  OTEL_SERVICE_NAME
otel.traces.sampler.arg            ->  OTEL_TRACES_SAMPLER_ARG
otel.javaagent.configuration-file  ->  OTEL_JAVAAGENT_CONFIGURATION_FILE   (hyphen -> _)
```

They are fully interchangeable — pick whichever fits the delivery mechanism:

- On the **command line / JVM args**: dotted form as a `-D` flag → `-Dotel.service.name=wegas`
- As an **environment variable**: `OTEL_SERVICE_NAME=wegas`
- In an **agent config file**: dotted form → `otel.service.name=wegas`

---

## 3. Precedence

From highest to lowest priority:

```
1. System properties   (-Dotel.exporter.otlp.endpoint=...)   ← wins
2. Environment variables (OTEL_EXPORTER_OTLP_ENDPOINT=...)
3. Agent config file    (otel.properties via otel.javaagent.configuration-file)
```

Consequences:

- A value in `otel.properties` acts as a **default**; both an env var and a `-D` flag will
  override it. This is exactly why keeping `otel.exporter.otlp.endpoint=http://localhost:4318`
  as a default in the file and **overriding it with `OTEL_EXPORTER_OTLP_ENDPOINT` in the
  cluster** works cleanly.
- The Dockerfile sets several `OTEL_*` as `ENV` defaults; those (env vars) will override the
  same key in a config file. So decide where a given default lives to avoid confusion.
- A stray `OTEL_*` env var in your shell can silently override the file — worth checking if a
  value seems ignored.

---

## 4. How to supply the configuration

Three approaches; they can be combined (defaults in a file, per-environment overrides via env).

**A. Environment variables (recommended for the cluster).** Native mechanism for
Docker/Kubernetes. The Dockerfile already carries `OTEL_*` defaults; the orchestrator
overrides per environment.

```bash
OTEL_ENABLED=true \
OTEL_SERVICE_NAME=wegas \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf \
OTEL_TRACES_EXPORTER=otlp \
OTEL_METRICS_EXPORTER=otlp \
OTEL_LOGS_EXPORTER=none \
./run
```

**B. Agent config file (`otel.properties`), good for stable defaults.** Create a file using
the **dotted** keys, and the `run` script passes it to the agent via
`-Dotel.javaagent.configuration-file`. Then a run is simply `OTEL_ENABLED=true ./run`.

```properties
# otel.properties
otel.service.name=wegas
otel.exporter.otlp.endpoint=http://localhost:4318
otel.exporter.otlp.protocol=http/protobuf
otel.traces.exporter=otlp
otel.metrics.exporter=otlp
otel.logs.exporter=none
```

Because of precedence (§3), you can keep **one** committed `otel.properties` with stable
defaults and override only the environment-specific bits (endpoint, `deployment.environment`,
sampling) with env vars in the cluster — no need for separate prod/local files.

**C. Hardcode `-Dotel.*` flags in `run`.** Works, but clutters the java command; use only
for one or two values that never change.

---

## 5. Why `OTEL_ENABLED` is special (and why the agent needs it)

`OTEL_ENABLED` is **not** an OpenTelemetry variable — it is our own switch inside
[`wegas-runtime/run`](run):

```bash
OTEL_ENABLED="${OTEL_ENABLED:-false}"
OTEL_OPTS=
if [ "${OTEL_ENABLED}" = "true" ]; then
    if [ -f "${OTEL_AGENT_JAR}" ]; then
        OTEL_OPTS="-javaagent:${OTEL_AGENT_JAR}"
        # ... optionally add -Dotel.javaagent.configuration-file=...
    fi
fi
# later:
"${JAVA_EXECUTABLE}" ${OTEL_OPTS} ... -jar ${PAYARA_MICRO} ...
```

The script uses it to decide **whether to add `-javaagent:` to the JVM at all**. This has two
hard consequences:

1. **It must be visible to the shell that runs `run`** — i.e. an exported environment
   variable, an inline `OTEL_ENABLED=true ./run`, or the default baked into the script /
   Dockerfile `ENV`. There is no other way for `run` to see it.
2. **It cannot be file-driven** (not via `otel.properties`, not via the Wegas properties
   files). A file read *by the agent* cannot decide whether the agent gets attached in the
   first place — chicken and egg. And the Wegas properties files are loaded too late anyway
   (§1a).

**So: no `OTEL_ENABLED=true` in the environment → no
`-javaagent` → the agent is never loaded, regardless of any `otel.*` config you set.**

### Where to set it

- **Locally:** `OTEL_ENABLED=true ./run`, or `export OTEL_ENABLED=true`.
- **Cluster / Docker:** the Dockerfile default is `OTEL_ENABLED=false`; the orchestrator
  (compose/k8s) sets it to `true` per environment.
- **Change the default:** flip `:-false` to `:-true` in `run` if you want it on by default.

### Alternative design

You *could* drop the gate and **always** attach the agent, then use the agent-native
`OTEL_SDK_DISABLED=true|false` (which *can* live in `otel.properties` or env) to turn
telemetry on/off. The trade-off is that the agent is always loaded — you pay its
startup/attach cost even when telemetry is off. Wegas uses the `OTEL_ENABLED` script gate
specifically to avoid attaching the agent when it is not wanted.

---

## 6. Quick reference — local test against SigNoz

```bash
cd wegas-runtime

# Sanity check the agent alone (prints spans to stdout, no backend needed):
OTEL_ENABLED=true OTEL_TRACES_EXPORTER=logging OTEL_METRICS_EXPORTER=none OTEL_LOGS_EXPORTER=none ./run

# Export traces to a locally-running SigNoz (OTLP on 4318):
OTEL_ENABLED=true \
OTEL_SERVICE_NAME=wegas \
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318 \
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf \
OTEL_TRACES_EXPORTER=otlp \
OTEL_METRICS_EXPORTER=none \
OTEL_LOGS_EXPORTER=none \
./run
```

Then generate traffic and look in the SigNoz UI → **Services** for `wegas`.
Enable metrics/logs later by flipping `OTEL_METRICS_EXPORTER` / `OTEL_LOGS_EXPORTER` to
`otlp` — no rebuild required.
