# PMG performance — findings and suggestions

**Status: hypotheses backed by structural evidence and code reading, not by
measurement.** Nothing here has been profiled. It is written to be the input to
the performance pass planned *after* the react-redux migration completes.

Context: **PMG** (`PMG Perf testing`, id 204, model-derived from 203) has known
performance problems; **MIMMS** (`Basic Scenario`, id 301) does not. Both are
client-facing. PMG is currently on hold; MIMMS is in active development.

Companion docs: [`pageContextStore-migration.md`](./pageContextStore-migration.md)
(the numbered follow-ups referenced below live in its section 4),
[`editingStore-migration.md`](./editingStore-migration.md),
[`pageStore-migration-plan.md`](./pageStore-migration-plan.md).

---

## 1. The comparison that shapes everything

Measured 2026-09-04 through the REST API (`/GameModel/{id}/Page`,
`/Library/ClientScript`, `/VariableDescriptor/`):

| | PMG (204) | MIMMS (301) | |
|---|---|---|---|
| pages | 13 | 101 | MIMMS 7.8x |
| components (static) | 562 | 1854 | MIMMS 3.3x |
| scripts | 557 | 2315 | MIMMS 4.2x |
| client libraries | 35 | 232 | MIMMS 6.6x |
| store-backed `<State>` | 1 (`interfaceState`) | 8 | MIMMS 8x |
| local `<State>` | 4 | 21 | MIMMS 5x |
| `onVariableChange` sites | 15 | 150 | MIMMS 10x |
| **variables** | **505** | 125 | **PMG 4x** |
| **`PageLoader`** | **1** | **63** | **MIMMS 63x** |
| components per page (static) | **~43** | ~18 | **PMG 2.4x** |

**MIMMS is larger on almost every axis and performs better.** Total scenario size
is therefore not the driver. Exactly two axes invert, and both point the same way.

### 1.1 Page decomposition (the strongest signal)

MIMMS spreads its UI across **63 `PageLoader`s** — many small pages mounted on
demand. PMG has **one**, so its screens are monolithic: ~43 static components per
page against MIMMS's ~18.

This matters because the costs in section 2 scale with **simultaneously mounted
scripted components**, not with how much content the scenario contains. A
scenario can be five times bigger and still cheaper per interaction if it only
ever mounts a fifth of it.

Caveat worth stating: static counts **undercount** what is actually mounted,
because `For each` expands at runtime (PMG 34 sites, MIMMS 105). The real
quantity is mounted-component count, which has to be measured, not counted. That
is the first thing the perf pass should capture.

### 1.2 Variable count

PMG has 505 variables against MIMMS's 125. The old data store holds
`variableDescriptors` and `variableInstances`, and `useAnyStore` re-runs **every**
subscriber's selector on **every** action. More variable instances means more
server-driven updates, each fanning out across every mounted consumer — and in
`useScript` that fan-out *evaluates scripts* (section 2.3).

---

## 2. Candidate mechanisms, ranked

### 2.1 Whole-context invalidation x monolithic pages (follow-up 4.5)

Every `useScript` consumer re-evaluates when **any** `exposeAs` changes, because
the dependency is the whole page-context values object
(`Components/Hooks/useScript.ts:807`). Cost per write is therefore
O(mounted scripted components), regardless of which key changed.

PMG's single store-backed `<State>` is `interfaceState` — UI state, written on
interaction. So: one hot key, written by the user, invalidating every scripted
component on a monolithic page. PMG's own client code confirms the pattern is
central, e.g. `Context.toggleSelect.setState({show: false})` inside an
`onVariableChange`.

**Fix direction:** narrow the dependency to the keys a script actually
references. The transpiler already walks the identifiers, so the reference set is
derivable at transpile time. Must preserve the identity coupling described in
`pageContextStore-migration.md` section 2 — the `state` record's identity change
is what makes reactive script state work at all.

**Independent of the migration.**

### 2.2 Every script evaluates twice (follow-up 4.3)

`useScript.ts:817` and `:836` both call `fn()`, and `isFirstRun.current` is set
to `true` at `:810` and never back to `false`, so the validation branch never
stops running and the second evaluation is unconditional — **in production**:

```ts
const returnValue = fn();
if (isFirstRun.current) { visitDSF(returnValue, …); }   // never disabled
return fn();                                             // evaluated again
```

Plausibly worth ~2x on script evaluation cost, and it compounds with 2.1: every
invalidation pays double. Side-effecting scripts run twice too.

**Fix:** reuse `returnValue` and actually clear the flag. Three lines.
**Independent of the migration, and the cheapest thing on this list.**

### 2.3 `useScript`'s selector evaluates scripts during store notification (follow-up 4.4)

`useScript.ts:813` passes a selector to the **old** data store's `useStore` that
calls `setGlobals(...)` and evaluates scripts as a side effect. `useAnyStore`
tolerates it because it only calls selectors from effects and subscriptions.

Consequence: every action on the old data store — including websocket-driven
variable-instance updates, of which PMG has 4x MIMMS's supply — triggers script
evaluation across all mounted consumers.

**This is the one the migration addresses**, but only when it finishes: the
mechanism disappears when `variableDescriptors` / `variableInstances` / `pages` /
`global` land in the new store and `data/connectStore.ts` +
`Components/Hooks/storeHookFactory.ts` are deleted. Until then it is untouched.

### 2.4 setState-during-render cascade (observed, new)

Observed while loading **MIMMS in player mode** on the migrated code:

```
Cannot update a component (ChildrenDeserializer) while rendering a different
component (PlayerText)
  at PlayerText → ComponentContainer → PageDeserializer → ChildrenDeserializer → State
```

A page-context write is happening *during* another component's render, via the
`<State>` component's `ChildrenDeserializer`. The most likely route is a script
calling `Context.<key>.setState(...)` while being evaluated inside a render pass
— which 2.3 makes possible, and which PMG's code does explicitly
(`Context.toggleSelect.setState`).

React responds by scheduling an extra render pass; done at scale during a paint
this is a self-amplifying cost. Not measured, and I have **not** established
whether it predates the migration — but note the migration *widens the blast
radius*: the dispatch now reaches the app store, so it wakes every
`useAppSelector` in the app rather than only page-context subscribers.

Worth an explicit look in the perf pass. It is also a correctness smell
independent of speed.

### 2.5 `addSetterToState` rebuilds the whole context per evaluation (follow-up 4.6)

`useScript.ts:545` is a `reduce` with `{ ...o, [k]: … }` in the body — O(n²)
allocations in the number of exposed keys, on **every** script evaluation, plus a
fresh `setState` closure per key each time. Small in absolute terms, but it sits
directly inside the hot path multiplied by 2.1 and 2.2.

**Fix:** a plain loop into one object, or memoise on the `context` reference,
which is now stable between writes.

### 2.6 The `getState` key leak (follow-up 4.2)

`Helpers.getState` allocates a fresh `state_N` key on every client-script reload
and abandons the previous one (confirmed live: one library save took a fixture
from `state_0, state_1` to `state_0 … state_3`). The `state` record therefore
grows monotonically across library saves, and every `setStateValue` copies the
grown record.

Matters most in the **editor** during authoring sessions with many saves, less in
a player session. PMG has 35 client libraries, so each save is also 35 library
re-evaluations.

---

## 3. What the migration will and will not fix

| Mechanism | Fixed by the react-redux migration? |
|---|---|
| 2.3 `useAnyStore` fan-out into script evaluation | **Yes**, but only when the old data store is fully gone |
| 2.4 setState-during-render | No — and the blast radius widens (fan-in) |
| 2.1 whole-context invalidation | No |
| 2.2 double evaluation | No |
| 2.5 `addSetterToState` allocations | No |
| 2.6 `getState` key leak | No |
| 1.1 page decomposition | No — content-side, not code |

**So the honest expectation is: do not assume the migration fixes PMG.** It
removes one mechanism (2.3), which may well be the dominant one given PMG's 505
variables — or may not, given that MIMMS carries the same mechanism and is fine.
The two axes that distinguish PMG from MIMMS are page decomposition and variable
count, and only the second is touched.

Corollary: 2.2 and 2.5 are three-line and ten-line fixes that need no migration.
If the perf pass shows PMG is script-evaluation-bound, those are the levers.

---

## 4. Suggested measurement plan

Ordered. Steps 1-2 are prerequisites; without them the rest is unfalsifiable.

1. **Pin the baseline.** PMG is on hold, so its content is stable and this is
   safe to do at the start of the pass rather than now. Capture: the commit hash
   of the comparison build; the content fingerprint (the table in section 1,
   recomputable with the same API probe); and — the important one — **one named,
   repeatable PMG interaction**, the one users actually complain about.
2. **Instrument, do not guess.** The metric that discriminates between every
   mechanism above is *`useScript` evaluations per interaction*. A counter in
   `useScript` plus a React Profiler recording separates 2.1 (many components,
   one dispatch), 2.2 (exactly 2x whatever 2.1 gives), 2.3 (evaluations on
   unrelated store actions) and 2.4 (extra render passes).
   `src/Components/Hooks/useWhyDidYouRender.ts` is already in the tree for the
   render-cause half.
3. **Count what is actually mounted**, not what exists — `For each` expansion
   means the static 562 is a floor, not the number.
4. **Compare against MIMMS as the control**, same interaction shape. A fast large
   scenario and a slow smaller one is far stronger evidence than either alone; if
   a proposed cause does not also explain why MIMMS is fine, it is not the cause.
5. **Then the A/B**: stable vs the completed migration, same pinned content, same
   interaction. This measures 2.3's removal — and nothing else on the list, which
   is exactly why steps 2-4 come first.
6. **Test 2.2 in isolation** (fix, re-measure the same interaction). Independent
   of everything else, so it can be done at any point.

Expect intermediate migration steps to read flat or slightly *worse*: each
partial migration adds fan-in cost (a merged slice's writes wake every
`useAppSelector`) before removing any fan-out cost (the old store still notifies
all its subscribers). That is structural, not regression.

---

## 5. If a quick win is wanted before the pass

In increasing order of effort, all independent of the migration:

1. **2.2, the double evaluation** — three lines, ~2x on script evaluation,
   testable in an afternoon on PMG alone.
2. **2.5, `addSetterToState`** — a loop instead of a spread-reduce.
3. **1.1, page decomposition** — split PMG's monolithic pages behind
   `PageLoader`s the way MIMMS does. This is content work, not code, and it is
   the change most likely to close the gap with MIMMS if 2.1 turns out to
   dominate. It is also the most expensive.
4. **2.1, dependency narrowing** — the real fix for the mechanism, but it needs
   care around the identity coupling that makes reactive script state work.
