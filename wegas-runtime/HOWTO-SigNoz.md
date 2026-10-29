# How to — SigNoz (local, for testing)

A minimal guide to run **self-hosted SigNoz locally** and receive Wegas telemetry via the
OpenTelemetry agent. This is a throwaway local setup for evaluation — not a production deploy.

## Prerequisites

- Docker + Docker Compose running locally.
- A few GB of free RAM (SigNoz runs ClickHouse).

## 1. Install Foundry (`foundryctl`)

```bash
curl -fsSL https://signoz.io/foundry.sh | bash
```

Verify:

```bash
foundryctl version
```

## 2. Create `casting.yaml`

We move the **Web UI off its default port `8080` to `8081`** (8080 is  collides with other local
services). Foundry has **no `ports` field** — it's silently ignored — so the port is changed
with a `spec.patches` entry (RFC 6902 JSON Patch) that rewrites the generated compose file:

```yaml
apiVersion: v1alpha1
kind: Installation
metadata:
  name: signoz
spec:
  deployment:
    flavor: compose
    mode: docker
  patches:
  - target: deployment/compose.yaml
    operations:
    - op: replace
      path: /services/signoz-signoz-0/ports/0
      value: "9090:8080"
```

Note: The patches section could be removed if we want SigNoz UI on its default port. 

## 3. Run it

```bash
foundryctl cast -f casting.yaml
```

`cast` re-runs `forge` automatically, so the patch is re-applied every time. Give ClickHouse a
minute to come up. Ports once running:

- **Web UI:** http://localhost:9090  ← patched (default would be 8080)
- **OTLP ingestion:** `4317` (gRPC) and `4318` (HTTP)

## 4. ⚠️ Log in FIRST — the setup isn't finished until you do

On first launch you **must open the UI and create the admin account / complete onboarding!**

Until you do this, SigNoz's setup is **not finished** and **telemetry will not be ingested** —
even if Wegas is sending data correctly, nothing will show up. **Do this before testing**.

## 5. Send Wegas telemetry and verify

With SigNoz up and you logged in, run Wegas pointed at the local OTLP endpoint:

```bash
OTEL_ENABLED=true ./run
```

Generate some traffic (open the Wegas UI / hit a REST endpoint), then in SigNoz go to
**Services** → you should see `wegas` within ~30–60s, with its traces.

(See [OTEL.md](OTEL.md) for the full list of `OTEL_*` variables and how to enable metrics/logs.)

## Tear down

Stop the rendered stack from the foundry working dir:

```bash
docker compose -f pours/deployment/compose.yaml down
```

(add `-v` to also drop the volumes / stored data)

## Handy

- Redeploy without regenerating: `foundryctl cast --no-forge`
