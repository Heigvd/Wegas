# `pageContextStore` → react-redux — notes & follow-ups

Context notes for the migration of `data/Stores/pageContextStore.ts` into the
single react-redux store (`src/store`). Step-by-step instructions live in
[`pageContextStore-migration-plan.md`](./pageContextStore-migration-plan.md).

Sibling docs: [`editingStore-migration.md`](./editingStore-migration.md),
[`pageStore-migration-plan.md`](./pageStore-migration-plan.md).

---

## 1. What `pageContextStore` was

```ts
interface PagesContextState {
  reloading: boolean;
  context: { [exposeAs: string]: unknown };  // { state: value } wrappers
  state:   { [exposeAs: string]: unknown };  // { state: value } wrappers
}
```

Three actions (`CONTEXT_SET`, `STATE_SET`, `RELOAD`), no thunks, no API calls, no
`manageResponseHandler` participation. Unlike `pageStore`, though, it is not a
small store — it is a small store holding a **public API surface**:

| Half | Written by | Read by |
|---|---|---|
| `context` | `<State>` page components (`State.component.tsx:84`) | scripts, as `Context.<exposeAs>.state` / `.setState` |
| `state` | `Helpers.getState` effects, keyed `state_0`, `state_1`, … | only the `[get, set]` pair that `getPageState` returned |

`Helpers.getState` is declared in `types/scripts/HelpersGlobals.d.ts:7` and
used by existing scenarios' client libraries. Its signature, its `[getState,
setState]` shape and its two thrown guards are a contract; the migration moved
the implementation verbatim and changed only how it reaches the store.

### The `reloading` flag

Not a loading indicator. `execAllScripts` (`clientScriptEvaluation.ts:19`) is the
only writer: it opens a window, `clearEffects()`, re-evaluates every client
library, `runEffects()` — each effect dispatching `STATE_SET` — then closes it.
The window exists so that page components do **not** observe the context while it
is being torn down and rebuilt. The old hook implemented that with a
per-component ref written inside the selector.

---

## 2. Design decisions taken

| Decision | Why |
|---|---|
| Freeze moves into the reducer (`values` + `frozen?`) | Keeps selectors pure. react-redux 8 runs selectors during render and re-runs them in dev to check stability; the old ref-in-selector is exactly what breaks there. |
| Freeze must not re-render, not merely return a stale value | An extra render of a `useScript` consumer rebuilds its `useStore` selector → new `stateUpdater` → its effect fires → **the script re-evaluates**. A render-body ref write would have re-run every page script on every `STATE_SET` during a reload. |
| `frozen = values` via immer draft aliasing | Both keys resolve to one finalized object, so the capture is free; the next write copies `values` and leaves `frozen` behind. Verified against RTK 1.9.7 / immer 9.0.6 — table in the plan, design note 2. |
| Capture guarded by `if (state.frozen === undefined)` | A reentrant `setReloading(true)` must not replace the snapshot with half-rebuilt values. Matches the old per-component ref, which never advanced mid-window. |
| Two selectors: published *and* live | `execAllScripts` passes `state: undefined`, so library evaluation falls through to the live fallback **inside** the reload window and must see the values it is itself producing. Published view there would break every library that reads its own `getState`. |
| `reloading` derived, not stored | `frozen !== undefined` is the same fact. One source of truth. |
| `PagesContextState` → `PageContextValues` (`{context, state}`) | `reloading` was never read from the object handed to scripts — only from the store directly, inside `getPageState`. Dropping it from the value type makes the boundary honest. |
| Both dev middleware checks skip `pageContext` | Values are arbitrary script output — functions, class instances, arbitrarily large graphs. `serializableCheck` would warn on all of it; `immutableCheck` would deep-walk it on every app dispatch. (Cyclic values never get that far — see 4.11.) |
| Hook and `getPageState` in `store/pageContextState.ts` | `getPageState` needs `store` / `dispatch` as values → real `slice → store → slice` runtime cycle if left in the slice. See plan, design note 6. |
| The `{ state: value }` wrapper kept | It is the scripting API shape (`Context.x.state`), not an implementation detail. |
| Keeping the `state` record in the value object | Consumers only *read* `.context`, but the identity change of the whole object is what makes `useScript` re-evaluate when a script-owned `getState` value is set. Split them and reactive script state silently stops updating. |

---

## 3. Accepted behaviour deltas

1. **A component mounting during a reload gets the frozen snapshot instead of
   `undefined`.** The old hook's `R | undefined` was reachable only in that
   window, and every call site resolved `undefined` to
   `pagesContextStateStore.getState()` — the live mid-reload state. A consistent
   snapshot is strictly better; nothing has to handle `undefined` any more.
2. **The freeze is global, not per-component.** The old code gave each consumer
   its own ref, so components mounted at different times could serve different
   snapshots of the same reload. One shared snapshot is more consistent.
3. **`reloading` is no longer visible in the object passed to script
   evaluation.** Nothing read it there.

Everything else — key naming, wrapper shape, evaluation order, the two thrown
strings, the `state_N` counter — is unchanged on purpose.

---

## 4. Follow-ups

Ordered by what I would do first. Nothing here is a regression from the
migration; items 2–9 are pre-existing and were found while tracing it.

### 4.1 ~~Add the reducer + selector spec~~ — done

`src/store/slices/pageContext.spec.ts`, 10 cases, no new dependencies (jest +
ts-jest already configured; `RootState` is imported *type-only* so the spec never
loads the store module or the app behind it). Covers the `{ state: value }`
wrapper, map independence, function values, capture-by-aliasing, the freeze
window, the reentrant-open guard, release, the empty-window reference identity,
and the key accumulation of 4.2. `yarn test` → 47 passing.

The empty-window case is the one worth keeping an eye on: open + close with no
writes must leave the published reference untouched, or every library save would
re-render every consumer for nothing. It holds only because the capture aliases
rather than copies.

### 4.2 `Helpers.getState` leaks a key per reload

`store/pageContextState.ts:58` — `let name = 0` is module scope and never resets.
`clearEffects()` empties the effect list but touches neither the counter nor the
`state` record, so every `execAllScripts` allocates **fresh** keys (`state_7`,
`state_8`, …) while `state_0…6` stay in the store forever. Two consequences:

- the `state` record grows without bound across library saves, and every
  `setStateValue` copies that growing record;
- **script state does not survive a reload** — a script's `getState` resets to
  its initial value. That is presumably why `Helpers.useRef(id, value)`
  exists (`Helper/pageEffectsManager.ts:28`, keyed by a caller-supplied id).

**Confirmed live** (WEG-295 manual run): with one library holding two
`Helpers.getState` calls, the store went from `state_0, state_1` to
`state_0 … state_3` after a single save — the first pair orphaned, the script now
reading the new pair. Two leaked keys per save per call site.

Not fixed here because the obvious fix is not obviously right: clearing
`values.state` on `setReloading(true)` is safe for consumers (they read `frozen`)
but silently drops any key whose effect is not re-registered. The real question is
whether script state should have a **stable identity** across reloads — i.e.
whether `getState` should take an id like `useRef` does. That is a scripting-API
decision, not a store one.

### 4.3 `useScript` evaluates every script twice, in production

`Components/Hooks/useScript.ts:817` and `:836`:

```ts
const returnValue = fn();
if (isFirstRun.current) { visitDSF(returnValue, …); }   // dev-style validation
return fn();                                             // <- evaluated again
```

`isFirstRun.current` is set to `true` at `:810` and **never** back to `false`, so
the validation branch runs on every pass and the second `fn()` is unconditional.
Every client script therefore runs twice per evaluation — including scripts with
side effects (`setState`, `APIMethods`, `addPopup`). Fix is to reuse
`returnValue` and to actually clear the flag:

```ts
const returnValue = fn();
if (isFirstRun.current) { isFirstRun.current = false; visitDSF(returnValue, …); }
return returnValue;
```

Worth its own ticket and its own manual pass, since anything relying on the
double execution would surface there.

### 4.4 `useScript`'s store selector has side effects — blocks the next migration

`useScript.ts:813-836` passes a selector to the **old** data store's `useStore`
that calls `setGlobals(globalContexts, s)` and evaluates scripts. Same pattern at
`:881`. `useAnyStore` tolerates it because it only ever calls selectors from
effects and subscriptions; react-redux does not — it calls them **during render**.

So this has to be restructured before the `pages` / `variableDescriptors` data
slices move to the new store, and it is the same class of problem the freeze had
here. Whoever picks up that migration should read §2 of this doc first.

### 4.5 Script re-evaluation is invalidated by the whole page context

Every `useScript` consumer re-evaluates when **any** `exposeAs` changes, because
the dependency is the whole values object (`useScript.ts:807`). Narrowing it to
the keys a script actually references is possible — the transpiler already walks
the identifiers — and would cut re-evaluation sharply on pages with several
`<State>` components. Related: the identity coupling described in §2, which any
such change must preserve.

### 4.6 `addSetterToState` rebuilds the whole context on every evaluation

`useScript.ts:545` is a `reduce` with `{ ...o, [k]: … }` in the body — O(n²)
allocations in the number of exposed keys, on **every** script evaluation, and it
recreates every `setState` closure each time. A plain loop into one object, or a
memo keyed on the `context` reference (which is now stable between writes), fixes
both.

### 4.7 `getPageState` throws bare strings

`store/pageContextState.ts:82` and `:93` throw string literals, not `Error`s. So
`handleError` (`useScript.ts:695`) falls into its "Unknown Error" branch and the
script author sees no file or line. Moved verbatim on purpose — scripts may be
catching them — but `throw new Error("Don't do that, …")` is the right shape.

**Confirmed live**: a top-level `getA()` in a client library surfaces as

```
[LibrariesLoader] Script error in transpiled ./weg295PageContext:undefined:undefined :
Unknown ErrorDon't do that, please nest getState in some callback
```

— note `undefined:undefined:undefined` for the location and the run-together
`Unknown Error` prefix. The guard itself works correctly; only its presentation
is poor.

### 4.8 Function-valued script state is unstorable

`SetState<T> = (stateOrFunction: T | SetStateFn<T>) => void` cannot be narrowed by
`typeof newState === 'function'` when `T` is unconstrained, which is why
`store/pageContextState.ts` casts. Consequence: for `getState<() => void>(fn)`,
`setState(otherFn)` is treated as an *updater* and stores `otherFn(fn)`. Fixing it
means changing the declared API in `types/scripts/HelpersGlobals.d.ts:7` — e.g. a
separate `setState.replace(value)` — so it was left alone.

### 4.9 Harden the reload window against a throw

`execAllScripts` closes the window on the last line. `safeClientScriptEval`
catches script errors and `runEffects` catches per-effect errors, so the path is
covered today — but a throw anywhere else between the two dispatches (e.g. in
`orderScripts`, or `computeLibraryPath`) would leave `frozen` set and the page
context frozen for the rest of the session. One line:

```ts
dispatch(setReloading(true));
try { … } finally { dispatch(setReloading(false)); }
```

Note also that the design assumes `execAllScripts` stays **synchronous**. If it
ever awaits, the window stays open across paints and users would see a stale page.

### 4.10 `<State>` never releases its context entry

`State.component.tsx:77` writes `context[exposeAs]` and has no cleanup, so the
entry survives the component's unmount and the page's teardown. Same family as
§4.2, and it interacts with §4.5: stale keys keep widening the invalidation set.
A cleanup returning a `clearContextValue(exposeAs)` dispatch is easy; deciding
whether a re-mount should keep the previous value is the actual question.

### 4.11 A cyclic script value crashes the reducer

Found while testing the middleware exemptions. Storing an object with a circular
reference throws:

```
[Immer] Immer forbids circular references
```

Pre-existing — immer's auto-freeze pass rejects it, and reproducing the old
reducer's `produce` shape against immer 9.0.6 throws identically, so this is not
a migration delta. But it is worth knowing:

- a client script returning a cyclic structure (easy to do accidentally — a
  parent/child graph, a DOM node, anything holding `self`) takes down the
  dispatch, not just the value;
- the error names immer, not the script or the `exposeAs` key, so it is
  near-undebuggable from a scenario author's seat.

Cheapest mitigation is a guarded dispatch in `State.component.tsx` /
`addSetterToState` that catches and reports which `exposeAs` was at fault. The
real fix is `setAutoFreeze(false)` for this slice's values, which is a wider
decision (it also stops immer from freezing script state at all — see 3).

### 4.12 Every store-backed `<State>` logs a script error on first paint

Also found while testing. On every load of a page with a `localState: false`
`<State>`, the console shows one warning per dependent script:

```
Script error in transpiled undefined:undefined:undefined :
Cannot read properties of undefined (reading 'state')
Script content is :   Context.urgent.state.test
```

Mount order, not the freeze: `State.component.tsx:77` writes the context entry in
a `useEffect`, which by React semantics runs *after* its children have rendered,
so the children necessarily evaluate once against a context that has no entry
yet. The store-action trace confirms the ordering — `setContextValue` lands
*after* the load-time reload window has already opened and closed:

```
setReloading true  (ctxKeys: [])
setReloading false (ctxKeys: [])
setContextValue    (ctxKeys: ['urgent'])
```

Pre-existing by the same reasoning: the old hook's first render also returned the
then-empty context (`useAnyStore` seeds `useState` from `store.getState()`).
Two further observations rule the freeze out as the cause: the error count did
not grow across library saves, and during a real reload window consumers read the
*populated* frozen snapshot, so they cannot produce this error.

I did not A/B it against a pre-migration build — the migration was committed
mid-test and rewriting that history to test was not worth it. If you want
certainty, `git worktree add` at `ac2bff068` and run a second dev server on
another port.

Worth fixing regardless: it is one bogus error per store-backed `<State>` per
load, and that noise hides real script errors. Dispatching during render, or
seeding the entry synchronously the way the `localState` branch does with
`React.useState`, would remove it.

### 4.13 Cosmetics

- The 4 hook call sites keep the local name `state`
  (`Pdf.component.tsx:57`, `Inputs/tools.ts:75`, `useScript.ts:778`,
  `Validate.tsx:168`). It reads oddly next to `PageContextValues.state`;
  `pageContext` would be clearer, at the cost of touching each `useCallback` dep
  array.
- `selectIsReloading` derives from `frozen`. If a second reason to freeze ever
  appears, the two concepts need separating.
- `data/connectStore.ts` and `Components/Hooks/storeHookFactory.ts` survive this
  migration — still used by `data/Stores/store.ts`, `themeStore.ts`,
  `editingStore.ts` and `pageStore.ts` on this branch. They are the last thing to
  delete when those land.
- `types/scripts/HelpersGlobals.d.ts:7` could document that `getState` / the
  returned `getState()` must not be called at the top level of a client library.
  That restriction is currently discoverable only by triggering the throw.

---

## 5. Merge notes

- **`store/store.ts` `middleware:` block.** The Editing branch adds its own
  (`edition` / `editorEvents` exemptions) to the same `configureStore` call.
  Resolve by merging the two option objects — the `pageContext` exemptions are
  required, not tuning (§2).
- **`EditableComponent.tsx`.** Touched by all three migrations. This branch
  changes only the `pageContextStore` import block and
  `assembleStateAndContext`; the `editingStore` and `pageStore` imports are left
  exactly as they are, so the conflict should be a clean both-sides keep.
- **`Validate.tsx`, `Inputs/tools.ts`.** Also touched by the Editing branch
  (`editingStore.dispatch` → `dispatch`). This branch only swaps the
  page-context hook line and its import.
- **`useScript.ts`.** Expect a conflict in the import block: this branch removes
  the `data/Stores/pageContextStore` import and adds three
  `store/…` imports, while other branches are also editing the neighbouring
  `data/Stores/store` and `store/store` lines.

## 6. Verification performed

### Automated

| Check | Result |
|---|---|
| `yarn build` (webpack production — the project's real typecheck) | exit 0; 2 pre-existing asset-size warnings |
| `npx tsc --noEmit` | clean — the 2 remaining errors are pre-existing parse failures in `node_modules/ol` |
| `yarn lint` on the 10 touched files + the spec | 0 errors, 10 pre-existing warnings (`no-explicit-any`, one `exhaustive-deps` in `useScriptCallback`) |
| `yarn test` | 47 passing (10 of them the new `pageContext.spec.ts`); 1 failure = pre-existing `immutableMerge.spec.ts` "Cyclic Object" |
| straggler grep | nothing left referencing the old store |
| immer aliasing / freeze semantics | verified against installed RTK 1.9.7 + immer 9.0.6 |

### Manual, run against a live backend

Scenario `Testing state` (gameModelId 251) turned out to be a purpose-built
page-context fixture: a `localState: false` `<State>` (`urgent`) and a
`localState: true` one (`africa`), with two `Text` children reading
`Context.urgent.state.test` and `Context.africa.state.test`.

Instrumented temporarily with a middleware logging every `pageContext/*` action
plus `frozen` and whether live had diverged from published. **The instrumentation
was reverted; nothing of it is in the tree.** A throwaway client library
`weg295PageContext` was created and then deleted — the scenario is back to zero
client libraries and its page JSON was never touched.

| # | Check | Result |
|---|---|---|
| 1 | `<State>` store path | `values.context.urgent = {state:{test:'Foreigner'}}`, written via `setContextValue`; renders "Foreigner". `africa` correctly **absent** from the store — the `localState` branch bypasses it. **Pass** |
| 1b | published view → re-evaluation | dispatching `setContextValue(urgent, …)` changed the rendered text to the new value while local-state "Toto" stayed put. **Pass** |
| 2 | `Helpers.getState` round trip | two `getState` calls produced `setStateValue(state_0)` / `setStateValue(state_1)`, each twice (immediate call + `runEffects`) — matches `getPageState`'s call-now-and-register design. **Pass** |
| 3 | **the reload window** | saving the library gave exactly: `setReloading(true)` → 4 × `setStateValue` (all with `frozen: true`) → `setReloading(false)`. One window, opened and closed once. `publishedIsLive` flipped to `false` on the first write and back to `true` on release, i.e. the published view stayed pinned to the pre-reload snapshot while live advanced. No flicker, no stale render. **Pass** |
| 3b | empty window | on load, with no libraries, the window opened and closed with `publishedIsLive: true` throughout — the capture aliased, so not one consumer re-rendered. **Pass** |
| 4 | reload guard | a top-level `getA()` threw `Don't do that, please nest getState in some callback` via `selectIsReloading`; the page still loaded and the window still closed (`safeClientScriptEval` catches) — which also validates 4.9's claim that the path is covered today. **Pass** (presentation is poor — 4.7) |
| 8 | dev-check exemptions | a function stored in `context`, then two non-exempt dispatches forcing both checks to scan the whole tree → **zero** warnings. **Pass** |
| — | Provider coverage | all three entrypoints (`index.tsx`, `player.tsx`, `host.tsx`) wrap `<Provider store={store}>` with the new store, so `usePageContext` is safe outside the editor bundle. **Pass** (static) |

### Round 2 — the remaining checks, in `[claude] sandbox`

Sandbox created 2026-09-04: `[claude] sandbox` (id **551**), a clone of
`[MikkMap] UnPeuDeReact` (501) — unlocked, light (19 pages, 3 client libraries),
and already carrying the variables and input widgets these checks need. Fixture
page **`weg295 fixture`** (page id 7) built through
`PUT /GameModel/551/Page/Page/7`, with component JSON harvested from real pages
rather than hand-written against the schemas:

```
FlexList
├── Text          '[age] ' + Variable.find(gameModel,'age').getValue(self)
├── State  exposeAs=sbx  localState=false  ({n: 1})
│   ├── Text          '[reader] sbx.n = ' + Context.sbx.state.n
│   ├── PdfPrinter    text reads Context.sbx.state.n                    (check 5)
│   ├── String input  validator:true, onVariableChange + onCancel       (checks 6, 7)
│   └── String input  no validator, onVariableChange                    (control)
├── State  exposeAs=dup  ({who:'first'})  + reader                      (check 10)
└── State  exposeAs=dup  ({who:'second'})                               (check 10)
```

The `onVariableChange` / `onCancel` **server** scripts do
`Variable.find(gameModel,'age').add(self, Context.sbx.state.n)` — so the `age`
variable is a witness that the server ran *and* that the page context reached it
through `assembleStateAndContext` → `getLivePageContext()`.

| # | Check | Result |
|---|---|---|
| 5 | PdfPrinter | clicking it logged `PDF text script ran, sbx.n=1` and posted to `print.html` — the `text` script evaluated through `usePageContext()` with the right context. **Pass** |
| 6 | `useOnVariableChange` | client script ran with `sbx.n=1`; `age` went **1 → 2**, i.e. the server script ran and consumed `Context.sbx.state.n`. **Pass** |
| 7 | `Validate` / `useOnCancelAction` | cancel logged `onCancel CLIENT sbx.n=1` and `age` went **3 → 13** (`10 * Context.sbx.state.n`). Client and server both. **Pass** |
| 10 | duplicate `exposeAs` | two store-backed `<State>` sharing `dup` → reader shows `second`. Last writer wins, no crash, unchanged from before. **Pass** |
| 9 | player mode (`player.tsx`) | **Pass**, but verified against **MIMMS** rather than the sandbox: the sandbox's game start page does not follow the index `defaultPageId`, so the fixture would not render there. MIMMS in player mode is the stronger test anyway — 8 store-backed `<State>`s and 1346 `Context.` references — and it rendered fully with no page-context errors. |

Cleanup: the sandbox's default page was restored to 4. The fixture page and its
logging probes were left in place deliberately — the logs *are* the assertions,
and the sandbox exists to be re-run.

**Anomaly found, not explained — outside this migration's surface.** In both the
`validator` and no-`validator` String inputs, the client script sees
`Object.keys(Context) = [sbx, dup, mainPageSize]` and `Context.value === undefined`
— the variable that `onVariableChange.exposeVariableAs` is supposed to expose is
**absent from `Context` entirely**, while both halves of the spread this migration
touches (the page-context keys and the props context) arrive correctly. Ruled
out: `Validate` (identical without it), the `exposeAs` fallback (`'value'` either
way), and a stale/duplicated invocation (a single log line per interaction).
`useOnVariableChange` (`Inputs/tools.ts:78-107`) reads correctly on inspection —
`newContext = {...context, [exposeAs]: variable}` — and PMG uses the mechanism in
production (`Context.bacInput`), so something about this fixture differs. Not
investigated further because the `exposeAs` plumbing is untouched by this
migration; recorded here so it is not lost.

Also observed, and written up in
[`PMG-performance-findings.md`](./PMG-performance-findings.md) section 2.4: MIMMS in
player mode logs `Cannot update a component (ChildrenDeserializer) while
rendering a different component (PlayerText)` through the `<State>` path — a
page-context write during another component's render. Whether it predates the
migration is not established; the migration does widen its blast radius.

## 7. Perf reference scenarios and the sandbox

The PMG-vs-MIMMS structural comparison, the ranked list of candidate mechanisms,
what the migration will and will not fix, and the measurement plan have moved to
their own document: **[`PMG-performance-findings.md`](./PMG-performance-findings.md)**.

The short version, because it constrains this migration's own perf story:

- **The decisive A/B is stable vs the *completed* migration, not per-store.** The
  dominant cost is `useAnyStore` in the **old** data store, whose selector in
  `useScript` (`useScript.ts:813`) evaluates scripts as a side effect (4.4). It
  survives every step of this series and disappears only when
  `variableDescriptors` / `variableInstances` / `pages` / `global` land and
  `data/connectStore.ts` + `Components/Hooks/storeHookFactory.ts` are deleted.
- **Expect intermediate steps to read flat or slightly worse.** Each partial
  migration adds fan-in cost (a merged slice's writes wake every
  `useAppSelector`) before removing any fan-out cost. Not a regression.
- **This migration's own contribution to fan-in** is `interfaceState` writes on
  PMG interaction — cost **B** from the `pageStore` plan's appendix. The reverse
  direction is safe by construction: an unrelated dispatch makes each consumer
  run `frozen ?? values`, two property reads returning a stable reference, so no
  re-render.
- **Do not duplicate PMG or MIMMS for testing.** Both are client-facing; a copy
  of an actively developed scenario diverges and gives false confidence. Read-only
  references: PMG the reproduction, MIMMS the control.

### Sandbox

**`[claude] sandbox` (id 551)** — a clone of `[MikkMap] UnPeuDeReact` (501),
created 2026-09-04, safe to modify or delete. Unlocked (no model), light enough
for a fast loop (19 pages, 3 client libraries), and it carries the variables and
input widgets the page-context checks need. It holds the `weg295 fixture` page
(id 7) described in section 6, and `[claude] session` (join key `_claude__se-dl`,
team `claude-team`) for player-mode checks.

`Testing state` (251) should stay pristine — its store-backed / local `<State>`
pair with two reader `Text`s is the cleanest existing documentation of the
feature, and it is what round 1 of the manual checks used.
