# `pageStore` → react-redux — notes & trace

Companion to [`pageStore-migration-plan.md`](./pageStore-migration-plan.md), which
is the executable checklist. This file holds the background, the decisions and the
follow-up list.

Same shape as [`editingStore-migration.md`](./editingStore-migration.md) for the
previous store in the series; cross-references to it are written as *editing §N*.

**Ticket:** WEG-298. **Status: complete.** All 6 steps landed;
`data/Stores/pageStore.ts` is deleted. Verified with `yarn build` (exit 0, the
project's real typecheck) and `yarn lint` (0 errors), plus the 7 browser checks in
§7bis — all pass.

---

## 1. What `pageStore` is

`data/Stores/pageStore.ts`, 64 lines, one standalone `createStore()` holding one
optional field:

```ts
interface PagesState {
  focusedComponent?: FocusedComponent; // { pageId, componentPath }
}
```

It is the *hover* highlight in the page editor, and nothing else. One action
(`COMPONENT_SET_FOCUSED`), no thunks, no API calls, no async, no websocket
participation, no `manageResponseHandler` involvement.

Its whole job is to keep two views in sync: hovering a component on the canvas
highlights the matching node in the Pages tree, and vice versa. That cross-linking
is why it cannot simply be CSS `:hover`.

### Surface

| | |
|---|---|
| Consumers | 2 files, 8 call sites |
| `Components/PageComponents/tools/EditableComponent.tsx` | `:622` module-level dispatch, `:663` read, `:690` / `:701` writes |
| `Editor/Components/Page/PagesLayout.tsx` | `:456` module-level dispatch, `:498` read, `:533` / `:539` writes |
| What the read drives | a `className`, and only that — `EditableComponent.tsx:751`, `PagesLayout.tsx:544` |

Both write sites are behind `editMode`, which is only ever true in the page editor.
**Player mode never dispatches into this store**, which bounds the blast radius of
the whole migration.

---

## 2. Why this store, and why not `pageContextStore`

The two remaining page-related standalone stores are very different jobs.

| | `pageStore` | `pageContextStore` |
|---|---|---|
| Lines | 64 | 151 |
| Consumers | 2 files | 5 files + the scripting API |
| Custom hook semantics | none | a stale-ref freeze during `reloading` |
| Imperative `getState()` outside React | none | 3 sites |
| Public API surface | none | `Helpers.getState` |
| State shape | one typed field | dictionary of arbitrary `unknown` keyed by author-chosen names |

`pageContextStore` is the harder one for reasons that are not about size:

1. **`usePagesContextStateStore` is an impure selector by design.** It wraps the
   store hook in a `React.useRef` that freezes the last selected value while
   `state.reloading` is true, and returns `R | undefined`. `useSelector` sits on
   `useSyncExternalStore`, which requires a pure and referentially stable result.
   Porting it means redesigning the reload protocol
   (`Components/Contexts/clientScriptEvaluation.ts:20-35` toggles the flag around
   script evaluation), not translating it.
2. **It is a public scripting API.** `getPageState` is exposed to scenario authors
   as `Helpers.getState` (`Components/Hooks/useScript.ts:413`, declared in
   `types/scripts/HelpersGlobals.d.ts:7`). Its contract — module-level counter for
   keys, `registerEffect` re-registration, synchronous read-after-write, throw
   while reloading — is frozen by scenarios already in production.
3. **Arbitrary values.** `unknown` keyed by `exposeAs` strings, wrapped as
   `{ state: value }`. RTK's `serializableCheck` would need exemptions, which is a
   deliberate decision rather than a config detail.

So `pageStore` first, on its own ticket. `pageContextStore` deserves its own design
pass — see follow-up #2.

---

## 3. Naming — why `pageEditor`

The slice is `store/slices/pageEditor.ts`, reducer key `pageEditor`. This was the
most-discussed decision of the migration, so the reasoning is recorded in full.

### 3.1 The problem: "page" already means three things

| File | Actually holds | Is it a store? |
|---|---|---|
| `data/Stores/pageStore.ts` | the hovered component | **yes** |
| `data/Reducer/pageState.ts` | page *content* + the page index, as `state.pages` | no — a slice of the main old store |
| `data/Stores/pageContextStore.ts` | script-authored state exposed to client scripts | **yes** |

Three unrelated concepts under near-identical names, and the naming is actively
inverted: **`pageStore.ts` is a store named like a reducer, and it holds no
pages.** Carrying `pageStore` / `pagesState` into the root store would import that
confusion into a namespace that has to last.

### 3.2 `pages` is spoken for

`pageState.ts` is already keyed `state.pages` in the old store's `combineReducers`,
and that is obviously the key it will claim when it migrates (§4). So any
`page*State`-flavoured name for *this* slice would end up sitting next to a `pages`
slice that means something else entirely.

### 3.3 Candidates considered

| Name | For | Against |
|---|---|---|
| `pageFocus` | named for exactly what it holds; matches the `announcements` / `initStatuses` / `edition` convention | leaves a one-field slice stranded if the rest of the page-editor UI state ever moves |
| `componentFocus` | most precise — the focused thing is a component, `pageId` is just part of its address | loses the hint that this is page-editor-scoped |
| **`pageEditor`** ✅ | a bucket the sibling page-editor UI state can join without a rename | names a scope rather than its content; slightly overpromising while it holds one field |
| `focusedComponent` | mirrors the existing field name, no new vocabulary | reads as `state.focusedComponent.focused`; collides with the `FocusedComponent` type |

**Chosen: `pageEditor`.** The deciding argument is that `focusedComponent` is not a
lone concept — it is one of several things the page editor is "pointing at", the
others being `selectedPageId`, `editedPath`, `editMode`, `showBorders` and
`showControls`, which today live in the `pageCTX` React context
(`Editor/Components/Page/PageEditor.tsx:53-64`). If any of those move to redux,
they move *here*, with no rename and no second slice.

Counter-argument, recorded because it is real: `pageCTX` is a **context**, not a
store, and the WEG- series migrates stores. Nothing on the roadmap moves it. So the
bucket may well hold one field for a long time.

### 3.4 What did *not* get renamed

`FocusedComponent`, `focused`, `focusKey`, `focusKeyOf`, `setFocused`,
`unsetFocused` all kept their names — they describe the field and the actions,
which are still about focus. DevTools shows `pageEditor/setFocused`.

### 3.5 A name clash that is a feature

`PageEditor.tsx:53` already declares a private
`interface PageEditorState { selectedPageId?, editedPath? }` — the same name the
slice now uses. It is not exported, so nothing breaks. The overlap describes the
same conceptual thing from two sides, and the two types merge if §3.3's future ever
arrives. Keep the one in `PageEditor.tsx` unexported.

---

## 4. `pageState` is a slice, not a store — and it should still be migrated

A question that came up during the naming discussion, worth recording because the
folder layout misleads.

### 4.1 The folder split is by kind, not by domain

- **`data/Stores/`** = actual `createStore()` instances. Five: `store.ts`,
  `editingStore.ts`, `themeStore.ts`, `pageStore.ts`, `pageContextStore.ts`.
- **`data/Reducer/`** = reducer functions.

Four of the reducers are combined into the *one* main store by
`data/Reducer/reducers.ts`:

```ts
export default { variableDescriptors, variableInstances, global, pages };
```

So `pageState.ts` is in `Reducer/` because it **is already a slice** — of the old
main store, reachable as `state.pages`. It never had a store of its own, so it has
no business in `Stores/`. The placement is correct.

> Note: editing §5 follow-up #8 lists this store's contents as
> `variableDescriptors, variableInstances, global, pages, players, teams`. `players`
> and `teams` have since moved (WEG-294 / WEG-304), so that entry is stale — four
> keys remain.

`data/Reducer/editingState.ts` is the genuinely misplaced file, not this one: a
reducer-less, state-less module in a folder called `Reducer/`. See editing §4bis.

### 4.2 It should be migrated, but it is a different class of work

| | `pageStore` (this ticket) | `pageState` |
|---|---|---|
| What it is | standalone store | slice of the main old store |
| State | one optional field | all page content + the page index |
| Thunks | 0 | 9, over `PageAPI` |
| Consumers | 2 files, 8 sites | ~11 files, ~30 sites |
| Coupling | none | shared `ActionType` / `ActionCreator` / `StateActions` union; `data/selectors/Page.ts` |
| Already half-migrated | n/a | dispatches `setInitStatus` into the new store at `pageState.ts:71` |

The hard part is not the reducer. It is that migrating `pages` means peeling one
key out of `combineReducers` while `global`, `variableDescriptors` and
`variableInstances` still live there, and its thunks emit `PAGE_ERROR` through the
action union those other reducers share.

**Ordering.** Naturally after the Variables migration, which peels the two big keys
off the same store. `global` should go last — `data/Stores/store.ts:26` still reads
`global.currentGameId` / `currentTeamId` to bootstrap the new store's teams.

---

## 5. Design decisions taken

### 5.1 A precomputed `focusKey` instead of comparing paths

The old selector ran **two** `JSON.stringify` calls per invocation:

```ts
JSON.stringify(focusedComponent.componentPath) === JSON.stringify(componentPath)
```

Acceptable on an isolated store that only ever saw one action type. On the app
store the selector re-runs on *every* dispatch × every mounted `ComponentContainer`
— hundreds on a large page. The slice therefore stores a flat
`pageId/0.1.2` key alongside the structured value, so the per-component selector is
one `===`.

`selectFocusedComponent` is exported with no consumer yet, so the structured value
stays reachable rather than being replaced by the key.

### 5.2 The reducer is idempotent

`PagesLayout`'s `onMouseOver` is a raw handler on a bubbling event, so it re-fires
as the pointer crosses child elements of the same node. Bailing out when the key is
unchanged keeps the state reference stable.

**This does not stop subscriber notification** — Redux notifies every subscriber on
every dispatch regardless of whether state changed. The guard helps re-renders, not
selector runs. Stopping the notification needs a pre-dispatch guard; see the plan's
appendix, fix 1.

### 5.3 No `useIsComponentFocused` hook in the slice

It would need `useAppSelector` from `store/hooks`, which imports `store/store`,
which imports the slice — a cycle. With two call sites, inlining the selector is
simpler and cycle-free. A third consumer would justify `store/pageEditorHooks.ts`,
the way `store/localEdition.ts` is split out from `store/slices/edition.ts`.

### 5.4 Naming `dispatch` — inverted from editing §4bis

Editing §4bis says: in a file where another `dispatch` belongs to a genuinely
different store, **alias the app one** (`import { dispatch as appDispatch }`),
because the alias signals that two stores are in play.

**This migration inverts that.** The new store's dispatch keeps the plain name;
the old store's is the one that gets aliased, to `oldDispatch`.

Rationale: the alias should mark the thing that is going away, not the thing that
is becoming the default. Every `oldDispatch` in the tree is then a to-do item that
disappears with the store it names, and no rename is needed at the end of the
series — whereas `appDispatch` would have to be un-aliased everywhere once the old
stores are gone.

The name is not new: `data/Reducer/pageState.ts:62` and
`data/Reducer/VariableDescriptorReducer.ts:62` already call the old store's thunk
dispatch `oldDispatch`.

Applied here:

| File | Before | After |
|---|---|---|
| `PagesLayout.tsx:175, :279, :699` | `const { dispatch } = store` (old data store) | `const { dispatch: oldDispatch } = store` |
| `PagesLayout.tsx:496` | — | `const dispatch = useAppDispatch()` |
| `EditableComponent.tsx:136` | `dispatch` thunk param of `createEditingAction` | `oldDispatch` |
| `EditableComponent.tsx:663` | — | `const dispatch = useAppDispatch()` |

Note the `PagesLayout` locals were never actually shadowing anything — the three
old-store ones live in `IndexItemAdder`, `IndexItemModifer` and `PageIndexTitle`,
while the new one is in `WegasComponentTitle`. The rename is for the reader, so
`dispatch(...)` means one thing throughout a file.

### 5.5 Types moved into the slice

`FocusedComponent` moves from `PageEditor.tsx:46` into the slice so the slice has no
import back into `Editor/`. Same rule as editing §3 applied to `Edition`.

No re-export is left behind in `PageEditor.tsx`: `pageStore.ts` was the type's only
importer and it is deleted, so a re-export would be a second public name with zero
consumers — and `noUnusedLocals` never flags unused *exports*, so nothing would
surface it as dead later. The type is app-internal (absent from every `.d.ts` and
from the scripting API), so there is no external consumer to keep it reachable for.

---

## 6. Performance — the reason this is not a pure rename

Merging an isolated store into the root store creates three distinct costs. Full
triage and five ranked fixes are in the plan's appendix; the summary:

| | Cost | Scales with | Prod? |
|---|---|---|---|
| **A** | RTK dev middleware deep-scanning state per dispatch | state size × dispatch rate | dev only |
| **B** | *Fan-in*: each hover dispatch wakes every `useAppSelector` in the app | app-wide selector count × hover rate | yes |
| **C** | *Fan-out*: each unrelated dispatch wakes N focus selectors | N page components × app dispatch rate | yes |

Two facts bound the risk: both dispatch sites are `editMode`-gated, so player mode
is untouched; and React 18 `createRoot` + react-redux 8 already batch.

The escape hatch worth knowing about is fix 4 — keeping this as a **separate** store
behind a react-redux custom context. That still deletes `createStoreConnector`,
which is the actual goal of the series, while restoring isolation. It is a
legitimate end state, not a failed migration; one root store was never the
requirement.

---

## 7. Verification

`tsc --noEmit` is still silently dead in this tree — re-confirmed independently
while working on Step 1, and it matches editing §3bis exactly:

- `npx tsc --noEmit -p tsconfig.json` reports only two `ol` `TS1005` syntax errors
- planting `const x: number = "definitely a string"` in the new slice produces **no
  output at all**
- `--listFiles` confirms the file *is* in the program, so it is diagnostic
  suppression, not a scoping gap
- `--skipLibCheck` does not help (it skips lib *checking*, not lib *parsing*)

So `yarn build` (ForkTsChecker) remains the only real typecheck. Per-step
verification for this migration is prettier + eslint, with `yarn build` at the
points where the tree is consistent — Steps 1 and 2 must land together to compile,
since the slice's selectors read `s.pageEditor` before the reducer is registered.

Editing §3bis follow-up #1 (the TypeScript bump) is unchanged and still open.

---

## 7bis. Browser verification

Dev server (`yarn start`, :3003) proxying a local Payara backend (:8080), scenario
**PMG Perf testing** — 11 pages, deeply nested components. The live store was read
directly out of the React fiber tree and a `store.subscribe` recorder counted
**notifications** (every dispatch) against **transitions** (only when `pageEditor`
actually changed).

| # | Check | Result |
|---|---|---|
| 1 | canvas hover → focus set | `1/0.0.4.0`, 1 dispatch, 1 transition |
| 2 | tree hover → canvas highlights | both the tree node and the 521x755 canvas container carry the inset shadow |
| 3 | pointer away → clears | zero shadowed elements; `focusKey` back to `undefined` |
| 4 | rapid sweep (14 hovers) | 12 dispatches, 10 transitions, no lag |
| 5 | nested components | child wins — resolved 9 levels deep to `1/0.0.2.1.0.0.0.0.0` |
| 6 | `pageId` participates | page Main → `1/…`, page Home → `2/1.1` |
| 7 | edit mode off | **0 dispatches**, state stays `{}` |

### What the numbers say

**Cost A is not real here.** No `ImmutableStateInvariantMiddleware took …more than
the warning threshold of 32ms` warning ever appeared, at any dispatch rate. The
`immutableCheck: { ignoredPaths }` block from Step 2 is therefore **not needed** —
leave the safety net on. Revisit only if the app store grows substantially.

**The reducer guard earns its keep, and fix 1 would earn more.** 14 hovers produced
12 dispatches for 10 real transitions: 2 no-op dispatches absorbed by the reducer,
each of which still notified every subscriber in the app (§5.2). The sweep's
transition list also shows the alternating `[null, key, null, key, …]` pattern from
`mouseout`/`mouseover` pairs crossing component boundaries — exactly what the rAF
coalescing of appendix fix 2 would collapse. Neither is worth doing yet at this
scale; the measurement is recorded so the decision has a baseline.

### Pre-existing issues seen, and confirmed not caused by this work

- `Script error … Cannot read properties of undefined (reading 'state')` from
  `getTypedInterfaceState()`, repeated at load. **Verified pre-existing** by
  stashing the migration, moving the slice aside, recompiling clean and reloading:
  the identical warnings appear on unmodified code. It is the `pageContextStore`
  `Helpers.getState` path failing on an unregistered `exposeAs` key — relevant
  background for follow-up #2, not a regression here.
- The scenarist lobby renders `9 Scenarios` with no cards under the `mine` filter;
  switching to `all` renders 10. Unrelated to this migration.

### Note for future browser checks

The app store is reachable from the console for exactly this kind of verification:

```js
const root = document.getElementById('root');
const key = Object.keys(root).find(k => k.startsWith('__reactContainer$'));
let store = null; const stack = [root[key]];
while (stack.length) { const f = stack.pop(); if (!f) continue;
  const v = f.memoizedProps && f.memoizedProps.value;
  if (v && v.store && typeof v.store.getState === 'function') { store = v.store; break; }
  if (f.child) stack.push(f.child); if (f.sibling) stack.push(f.sibling); }
```

It found the Provider 4 fiber nodes in. Counting `store.subscribe` callbacks against
observed state changes is the cheapest way to measure redundant dispatches.

---

## 8. Covered / not covered

### Covered by this migration

- `pagesStateStore` → `store/slices/pageEditor.ts`; `data/Stores/pageStore.ts` deleted
- `PageStateAction` → slice action creators
- `isComponentFocused` → an inline `focusKey` comparison at both call sites
- `usePagesStateStore` → `useAppSelector`
- module-level `pagesStateStore.dispatch` → `useAppDispatch()` in both components
- `FocusedComponent` moved to the slice; the declaration in `PageEditor.tsx` deleted (no re-export — it had no importers left)

### NOT covered — follow-ups

| # | Item | Notes |
|---|---|---|
| 1 | **`data/Reducer/pageState.ts`** (§4) | the real page data. Sized above; best after the Variables migration |
| 2 | **`pageContextStore`** (§2) | needs a design pass on the `reloading` protocol before any port. The `Helpers.getState` contract is frozen by live scenarios |
| 3 | **`themeStore`** | untouched by this series so far |
| 4 | **`data/Stores/store.ts`** | four keys left; `global` last, because `storeInit` reads it |
| 5 | **`data/connectStore.ts` + `Components/Hooks/storeHookFactory.ts`** | deletable only when the last old store is gone. Still used by `store.ts`, `themeStore`, `editingStore`, `pageContextStore` |
| 6 | **Perf fixes 1 and 2** | the pre-dispatch thunk guard and rAF coalescing. Measured in §7bis: 2 redundant dispatches per 14 hovers, no middleware warning. Not worth doing at this scale; baseline recorded |
| 7 | **`pageCTX` → the `pageEditor` slice** (§3.3) | `selectedPageId`, `editedPath`, `editMode`, `showBorders`, `showControls`. Would justify the slice's name and let `PageEditorState` merge (§3.5). Not on the roadmap — the series migrates stores, and this is a context |
| 8 | **No test coverage** | as editing §5 #18 — no jsdom, no `@testing-library/react`, so both call sites are covered by manual checks only. The reducer itself is trivially unit-testable and a `store/pageEditor.spec.ts` would cost little |
| 9 | **Editor-level Cypress specs** | the manual check-list in the plan is the natural first spec; harness and CI wiring already exist (editing §3ter) |

### Gotchas to remember

- **Comparator polarity is inverted.** `useAnyStore` takes a `shouldUpdate`
  ("different") predicate; `useAppSelector` takes an `equalityFn` ("equal"). Both
  call sites here select a boolean, so default reference equality is correct and no
  equality function is needed — unlike editing, where two selectors built fresh
  objects.
- **The reducer guard is not a dispatch guard.** §5.2.
- **`editMode` must stay inside the selector**, not around the hook — hooks cannot be
  called conditionally, and short-circuiting inside keeps the string compare off the
  hot path in player mode.
